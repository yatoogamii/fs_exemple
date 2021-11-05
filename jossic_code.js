// @desc      generate invoice with type between 2 dates
// @route     POST /api/invoices/:/:endDate
// @access    Private
const generatePdfInvoice = asyncHandler(async (req, res) => {
	const { dateInitiale, dateFinale, typeEdition } = req.body;
	const pathPDF = `Factures ${dateInitiale}-${dateFinale}.pdf`;
	const saveFiles = async (invoiceArray) => {
		let invoicePath = [];

		invoiceArray.forEach((url, index) => {
			const file = fs.createWriteStream(`pdfToMerge/${index}.pdf`);
			const request = https.get(url, (response) => {
				response.pipe(file);
			});
		});

		invoiceArray.forEach((url, index) => {
			invoicePath.push(`./pdfToMerge/${index}.pdf`);
		});
		return invoicePath;
	};

	const mergeFiles = (files) => {
		files.forEach((file) => {
			merger.add(file);
		});

		try {
			merger.save('merged.pdf'); //save under given name and reset the internal document
		} catch (error) {
			console.log(`error =>`, error);
		}

		deleteFiles();
	};

	const deleteFiles = () => {
		const directory = './pdfToMerge/';
		fs.readdir(directory, (err, files) => {
			if (err) throw err;

			for (const file of files) {
				fs.unlink(path.join(directory, file), (err) => {
					if (err) throw err;
				});
			}
		});
	};

	const factures = await Facture.find({
		//query today up to tonight
		dateFacture: {
			$gte: dateInitiale,
			$lt: dateFinale,
		},
	});
	console.log(`factures =>`, factures.length);
	let invoiceArray = [];
	let falsyInvoice = [];
	factures.map((facture) => {
		if (facture.pdfLink) {
			invoiceArray.push(facture.pdfLink);
		} else {
			falsyInvoice.push(facture);
		}
	});
	console.log(`invoiceArray =>`, invoiceArray.length);

	const invoicePath = await saveFiles(invoiceArray);

	console.log(`invoicePath =>`, invoicePath);

	// On attend 2 secs que les fichiers soient bien générés puis on merged & delete
	setTimeout(() => {
		await mergeFiles(invoicePath);
	}, 3000);
	setTimeout(() => {
		if (factures) {
			let pdf = fs.readFileSync('./merged.pdf');
			let params = {
				Bucket: 'gites-wao-compta',
				ACL: 'public-read',
				Key: pathPDF,
				Body: pdf,
				ContentType: 'application/pdf',
				ContentDisposition: 'inline',
			};
			s3.upload(params, async (err, data) => {
				if (err) {
					console.log('erreur =>', err);
					return;
				} else {
					res.json({
						lien: data.Location,
						falsyInvoice,
						message: `Génération de ${invoiceArray.length} facture(s) effectuée`,
					});
				}
			});
		} else {
			res.status(404);
			throw new Error('Aucune factures sur la période sélectionnée');
		}
	}, 2000);
});

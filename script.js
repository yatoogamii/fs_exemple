const fs = require("fs/promises")

// Je note en dur les noms des fichiers que tu dois récupérer sur S3
const FILES_NAMES = ["s3_fichier1.json", "s3_fichier2.json", "s3_fichier3.json"];

// J'utilise une IIFE pour pouvoir utiliser async/await malgré que j'sois dans le top level
(async () => {

    const savesFiles = async () => {
        try {
            await Promise.all(FILES_NAMES.map(async (fileName) => {
                const fileBuffer = await fs.readFile("./mock_s3/" + fileName);
                await fs.writeFile("./files/" + fileName, fileBuffer)
                console.log("create the file :", fileName);
            }))
        } catch (error) {
            console.log("error during the saveFiles: ", error);
        }
    }

    // je simule ce que fais ton `merger` le code de cette fonction n'est pas vraiment important vu que tu utilises un module pour
    const mergeFiles = async (files) => {
        try {
            const merger = [];
            for (file of files) {
                const fileBuffer = await fs.readFile("./files/" + file);
                merger.push(fileBuffer);
            }

            const mergedBuffer = Buffer.concat([...merger]);

            await fs.writeFile("./mergedFiles.json", mergedBuffer);

            console.log("successfully merge the file into mergedFiles.json");

            await deleteFiles();
        } catch (error) {
            console.log("error during the mergeFiles: ", error);
        }
    }


    const deleteFiles = async () => {
        try {
            const folderName = "./files"
            const filesToRemove = await fs.readdir(folderName);
            for (file of filesToRemove) {
                await fs.unlink(folderName + "/" + file);
                console.log("delete the file :", file);
            }
        } catch (error) {
            console.log("error during the deleteFiles: ", error);
        }
    }

    await savesFiles();
    await mergeFiles(FILES_NAMES);
    await deleteFiles()

})();

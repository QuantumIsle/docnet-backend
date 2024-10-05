const fs = require("fs");
const { google } = require("googleapis");

const apikeys = require("./controllers/token.json");
const SCOPE = ["https://www.googleapis.com/auth/drive"];

// A Function that can provide access to google drive api
async function authorize() {
  const jwtClient = new google.auth.JWT(
    apikeys.client_email,
    null,
    apikeys.private_key,
    SCOPE
  );

  await jwtClient.authorize();

  return jwtClient;
}

// A Function that will upload the desired file to google drive folder
async function uploadFile(authClient) {
  return new Promise((resolve, reject) => {
    const drive = google.drive({ version: "v3", auth: authClient });

    var fileMetaData = {
      name: "test.pdf",
      parents: ["1wAobbjcMFobmXRpaInTc20o19NJZVJz1"], // A folder ID to which file will get uploaded
    };

    drive.files.create(
      {
        resource: fileMetaData,
        media: {
          body: fs.createReadStream("test.pdf"), // files that will get uploaded
          mimeType: "application/pdf", // correct MIME type for PDF
        },
        fields: "id",
      },
      function (error, file) {
        if (error) {
          return reject(error);
        }
        resolve(file.data.id); // return the file ID
      }
    );
  });
}

// A Function to set file permissions to be shareable
async function setFilePublic(authClient, fileId) {
  const drive = google.drive({ version: "v3", auth: authClient });
  return new Promise((resolve, reject) => {
    drive.permissions.create(
      {
        fileId: fileId,
        resource: {
          role: "reader", // set permission to reader
          type: "anyone", // accessible by anyone
        },
      },
      function (error, permission) {
        if (error) {
          return reject(error);
        }
        resolve(fileId); // return the file ID again for the next step
      }
    );
  });
}

// A Function to get the shareable link
async function getShareableLink(authClient, fileId) {
  const drive = google.drive({ version: "v3", auth: authClient });
  return new Promise((resolve, reject) => {
    drive.files.get(
      {
        fileId: fileId,
        fields: "webViewLink", // retrieve the link to view the file
      },
      function (error, file) {
        if (error) {
          return reject(error);
        }
        resolve(file.data.webViewLink); // return the web link
      }
    );
  });
}

// Main function to upload the file and get the shareable link
authorize()
  .then(async (authClient) => {
    const fileId = await uploadFile(authClient); // Upload file and get its ID
    await setFilePublic(authClient, fileId); // Set the file as public
    const link = await getShareableLink(authClient, fileId); // Get the shareable link
    console.log("Shareable link:", link); // Print the shareable link
  })
  .catch(console.error);

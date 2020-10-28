export const urlToSpreadsheetID = (url: String): String | null => {
    if (!url.includes('docs.google.com/spreadsheets')) {
        return null;
    }

    let idStart = url.lastIndexOf('/d/');
    let idEnd = url.lastIndexOf('/edit');
    if (idEnd === -1) {
        idEnd = url.lastIndexOf('/');
    }
    if (idEnd === idStart + 2) {
        idEnd = url.length;
    }

    return url.substring(idStart + 3, idEnd);
};

export const fetchSheet: (options: {spreadsheetId: String; apiKey: String; complete: (String) => any}) => any = ({
    spreadsheetId,
    apiKey,
    complete,
}) => {
    let url = `https://cors-anywhere.herokuapp.com/https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;

    console.log('Fetching', url);
    return fetch(url)
        .then(response =>
            response.json().then(result => {
                let sheetName = result.sheets[0].properties.title;
                let url = `https://cors-anywhere.herokuapp.com/https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
                fetch(url).then(response => {
                    response.json().then(result => {
                        complete(result);
                    });
                });
            })
        )
        .catch(err => {
            // Handle error
            console.log(err);
        });
};

export const loadImage = (id, imageUrl) => {
    // console.log(imageUrl);

    fetch(imageUrl)
        .then(function(response) {
            return response.arrayBuffer();
        })
        .then(function(data) {
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'loadedImage',
                        id: id,
                        imageData: new Uint8Array(data),
                    },
                },
                '*'
            );
        });
};

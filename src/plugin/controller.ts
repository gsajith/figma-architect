figma.showUI(__html__, {height: 400});

const validateSelection = (fieldNames, selection) => {
    if (!selection || selection.length !== 1 || !(selection[0] as FrameNode).children) {
        // TODO: Send toast
        console.log('Please select a frame');
        return false;
    } else {
        return true;
    }
};

const runProgram = (parentId, childId, data) => {
    if (!data || data.length < 2) return;

    let newPage = figma.createPage();
    newPage.name = 'Architect';

    newPage.children.forEach(child => {
        child.remove();
    });

    let pathToParent = [];
    let child = (figma.getNodeById(childId) as FrameNode).clone();
    let parentRoot = figma.getNodeById(parentId);
    while (parentRoot.parent && parentRoot.parent.type !== 'PAGE') {
        let childId = parentRoot.id;
        parentRoot = parentRoot.parent as FrameNode;
        parentRoot.children.forEach((child, index) => {
            if (child.id === childId) {
                pathToParent.unshift({index: index, name: child.name});
            }
        });
    }

    parentRoot = (parentRoot as FrameNode).clone();
    newPage.appendChild(parentRoot);
    newPage.appendChild(child);
    let parent = parentRoot;
    pathToParent.forEach(path => {
        parent = (parent as any).children[path.index] as any;
    });

    parentRoot.x = 0;
    parentRoot.y = 0;

    let fieldNames = data[0];
    let rowData = data.slice(1);
    let parentParent = parent.parent;

    rowData.forEach((data, index) => {
        let newParent = parent.clone();
        parentParent.appendChild(newParent);
        let newId = newParent.id;
        crawlChild(newParent, newId, fieldNames, data);

        let newChild = (child as any).clone();
        newPage.appendChild(newChild);
        newChild.x = (index % 5) * (child.width + 50) + parentRoot.width + 250;
        newChild.y = Math.floor(index / 5) * (child.height + 50);

        let matchedChild = findChild(newChild, pathToParent);
        crawlChild(matchedChild, newId, fieldNames, data);

        matchedChild.name = matchedChild.name + ' ' + newId;
        newParent.name = newParent.name + ' ' + newId;
        newChild.name = newChild.name + ' ' + newId;

        // TODO: Match up prototype links properly
    });

    child.remove();
    parent.remove();
};

// type Writeable<T> = {-readonly [P in keyof T]: T[P]};

const findChild = (child, pathToChild) => {
    let foundChild = child;

    pathToChild.forEach(path => {
        if (foundChild.children) {
            let matchedChild = null;
            foundChild.children.forEach(n => {
                if (!matchedChild && n.name === path.name) {
                    matchedChild = n;
                }
            });
            foundChild = matchedChild;
        }
    });

    return foundChild;
};

const crawlChild = (child, newId, fieldNames, data) => {
    child.children.forEach(c => {
        if (fieldNames.includes(c.name) && c.type === 'TEXT') {
            // TODO: Might be loading fonts too many times
            figma.loadFontAsync(c.getRangeFontName(0, 1) as FontName).then(() => {
                let origLength = c.characters.length;
                let origX = c.x;
                c.insertCharacters(origLength, data[fieldNames.indexOf(c.name)]);
                c.deleteCharacters(0, origLength);
                c.x = origX;
                c.name = c.name + ' ' + newId;
            });
        } else if (fieldNames.includes(c.name) && c.type === 'ELLIPSE') {
            let imageUrl = data[fieldNames.indexOf(c.name)];
            figma.ui.postMessage({type: 'loadImage', id: c.id, message: imageUrl});
            c.name = c.name + ' ' + newId;
        } else {
            c.name = c.name + ' ' + newId;
        }
        if (c.children) {
            crawlChild(c, newId, fieldNames, data);
        }
    });
};

figma.ui.onmessage = msg => {
    if (msg.type === 'cancel') {
        figma.closePlugin();
    } else if (msg.type === 'selectParent' || msg.type === 'selectChild') {
        if (validateSelection(msg.fieldNames, figma.currentPage.selection)) {
            figma.ui.postMessage({
                type: msg.type === 'selectParent' ? 'selectedParent' : 'selectedChild',
                message: figma.currentPage.selection[0].id,
            });
        } else {
            console.log('Invalid selection');
        }
    } else if (msg.type === 'runProgram') {
        if (
            msg.parentId &&
            msg.childId &&
            figma.getNodeById(msg.parentId) &&
            figma.getNodeById(msg.childId) &&
            msg.data
        ) {
            runProgram(msg.parentId, msg.childId, msg.data);
        } else {
            // TODO: Toast missing parent or child
            console.log('Missing parent or child');
        }
    } else if (msg.type === 'loadedImage') {
        // console.log(msg.id, msg.imageData);
        let node = figma.getNodeById(msg.id) as GeometryMixin;
        const newFills = [];
        (node.fills as Paint[]).forEach(fill => {
            if (fill.type === 'IMAGE') {
                const newPaint = JSON.parse(JSON.stringify(fill));
                newPaint.imageHash = figma.createImage(msg.imageData).hash;
                newFills.push(newPaint);
                node.fills = newFills;
            }
        });
    }
};

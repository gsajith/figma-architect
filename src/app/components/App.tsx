import React, {useRef, useCallback, useEffect, useState} from 'react';
import '../styles/ui.css';
import {fetchSheet, loadImage, urlToSpreadsheetID} from '../util/common';

declare function require(path: string): any;

const App = ({}) => {
    const textbox = useRef<HTMLInputElement>(undefined);
    const [data, setData] = useState(null);
    const [dataFetched, setDataFetched] = useState(false);
    const [parentPicked, setParentPicked] = useState(false);
    const [parentId, setParentId] = useState(null);
    const [childPicked, setChildPicked] = useState(false);
    const [childId, setChildId] = useState(null);

    const urlRef = useCallback((element: HTMLInputElement) => {
        if (element)
            element.value =
                'https://docs.google.com/spreadsheets/d/1_ADuha1sAvuYAmY5bHcj__uv2VxoCLy6wWJIawX_o4s/edit?usp=sharing';
        textbox.current = element;
    }, []);

    const processResults = useCallback(rows => {
        if (!rows || !rows.values || rows.values.length === 0) {
            // TODO: Throw error;
            return null;
        }

        setData(rows.values);
    }, []);

    useEffect(() => {
        setDataFetched(data !== null);
    }, [data]);

    const onFetch = useCallback(() => {
        const url = textbox.current.value;
        if (urlToSpreadsheetID(url)) {
            const options = {
                spreadsheetId: urlToSpreadsheetID(url),
                complete: processResults,
                apiKey: process.env.SHEETS_API_KEY,
            };
            fetchSheet(options);
        } else {
            // Show error
        }
    }, []);

    const onCancel = useCallback(() => {
        parent.postMessage({pluginMessage: {type: 'cancel'}}, '*');
    }, []);

    const onSelectParent = useCallback(() => {
        parent.postMessage({pluginMessage: {type: 'selectParent', fieldNames: data[0]}}, '*');
    }, [data]);

    const onSelectChild = useCallback(() => {
        parent.postMessage({pluginMessage: {type: 'selectChild', fieldNames: data[0]}}, '*');
    }, [data]);

    const onRun = useCallback(() => {
        parent.postMessage(
            {
                pluginMessage: {
                    type: 'runProgram',
                    parentId: parentId,
                    childId: childId,
                    data: data,
                },
            },
            '*'
        );
    }, [parentId, childId, data]);

    useEffect(() => {
        // This is how we read messages sent from the plugin controller
        window.onmessage = event => {
            const {type, message} = event.data.pluginMessage;
            if (type === 'selectedParent') {
                if (message) {
                    setParentPicked(true);
                    setParentId(message);
                    console.log(message);
                }
            } else if (type === 'selectedChild') {
                if (message) {
                    setChildPicked(true);
                    setChildId(message);
                }
            } else if (type === 'loadImage') {
                const id = event.data.pluginMessage.id;
                loadImage(id, message);
            }
        };
    }, []);

    return (
        <div>
            <p>
                URL: <input ref={urlRef} />
            </p>
            <button id="fetch" onClick={onFetch}>
                Fetch
            </button>

            {dataFetched && (
                <>
                    <p>Data fetched</p>
                    <button id="selectParent" onClick={onSelectParent}>
                        Select parent
                    </button>
                </>
            )}
            {parentPicked && (
                <>
                    <p>Parent picked</p>
                    <button id="selectChild" onClick={onSelectChild}>
                        Select child
                    </button>
                </>
            )}
            {childPicked && (
                <>
                    <p>Child picked</p>
                    <button id="runButton" onClick={onRun}>
                        Run the thing
                    </button>
                </>
            )}
            <button onClick={onCancel}>Cancel</button>
        </div>
    );
};

export default App;

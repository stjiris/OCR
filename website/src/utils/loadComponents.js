function loadComponent(path, document) {
    try {
        return require(`${path}/${process.env.REACT_APP_HEADER_STYLE}/${document}`);
    } catch (e) {
        return require(`${path}/Geral/${document}`);
    }
}

export default loadComponent;
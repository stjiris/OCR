function loadComponent(folder, document) {
    try {
        return require(`../Components/${folder}/${process.env.REACT_APP_HEADER_STYLE}/${document}`).default;
    } catch (e) {
        return require(`../Components/${folder}/Geral/${document}`).default;
    }
}

export default loadComponent;
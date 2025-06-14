export const editingMenuState = {
    searchMenu: false,
    editingMenu: true,
    layoutMenu: false,
    ocrMenu: false,
};

export const fileSystemState = {
    searchMenu: false,
    editingMenu: false,
    layoutMenu: false,
    ocrMenu: false,
    contents: []
};

export const layoutMenuState = {
    searchMenu: false,
    editingMenu: false,
    layoutMenu: true,
    ocrMenu: false,
};

export const ocrMenuState = {
    searchMenu: false,
    editingMenu: false,
    layoutMenu: false,
    ocrMenu: true,
};

export const searchMenuState = {
    searchMenu: true,
    editingMenu: false,
    layoutMenu: false,
    ocrMenu: false,
    fileOpened: "",
    contents: [],
    filesChoice: [],
    algorithmChoice: [],
    configChoice: []
};

export const closeFileSystemMenus = {
    fileOpened: null,
    isFolder: false,
    ocrMenu: false,
    layoutMenu: false,
    editingMenu: false,
}

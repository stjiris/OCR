export const editingMenuState = {
    searchMenu: false,
    editingMenu: true,
    layoutMenu: false,
};

export const fileSystemState = {
    searchMenu: false,
    editingMenu: false,
    layoutMenu: false,
    fileOpened: "",
    contents: []
};

export const layoutMenuState = {
    searchMenu: false,
    editingMenu: false,
    layoutMenu: true,
};

export const searchMenuState = {
    searchMenu: true,
    editingMenu: false,
    layoutMenu: false,
    fileOpened: "",
    contents: [],
    filesChoice: [],
    algorithmChoice: [],
    configChoice: []
};

export const closeFileSystemMenus = {
    fileOpened: null,
    layoutMenu: false,
    editingMenu: false,
}

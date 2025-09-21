import React from 'react';
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from "@mui/material/Typography";
import SaveIcon from '@mui/icons-material/Save';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import { NumberField } from '@base-ui-components/react/number-field';
import Tooltip from "@mui/material/Tooltip";

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

import ReturnButton from 'Components/FileSystem/ReturnButton';
import ConfirmLeave from 'Components/Notifications/ConfirmLeave';
import Notification from 'Components/Notifications/Notification';
import LayoutImage from './LayoutImage';
import LayoutTable from './LayoutTable';

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

const cannotAutoSegment = new Set(["gif"]);
/*
files currently accepted by the platform that can be automatically segmented:
application/pdf
image/jpeg
image/png
image/tiff
image/bmp
image/webp (not listed in CV2 doc but accepted)
image/x-portable-anymap
image/jp2
application/zip (pages are stored as PNG)
*/

class LayoutMenu extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			contents: [],
			currentPage: 1,

			boxes: [],
			uncommittedChanges: false,

			selectedRows: [],

			typeSelected: "",

			segmentLoading: false,

			textModeState: true,
		}

		this.image = React.createRef();
		this.confirmLeave = React.createRef();

		this.successNotifRef = React.createRef();
		this.errorNotifRef = React.createRef();

        this.updateBoxes = this.updateBoxes.bind(this);
        this.newGroup = this.newGroup.bind(this);

        this.allCheckboxesAreChecked = this.allCheckboxesAreChecked.bind(this);
        this.commitAllCheckBoxes = this.commitAllCheckBoxes.bind(this);
        this.changeChecked = this.changeChecked.bind(this);
        this.switchType = this.switchType.bind(this);
        this.reorderBoxes = this.reorderBoxes.bind(this);

        this.goBack = this.goBack.bind(this);
        this.leave = this.leave.bind(this);
	}

	preventExit(event) {
		event.preventDefault();
		event.returnValue = '';
	}

    getLayouts() {
        const path = (this.props.spaceId + '/' + this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
        const is_private = this.props._private ? '_private=true&' : '';
        fetch(API_URL + '/get-layouts?' + is_private + 'path=' + path, {
            method: 'GET'
        }).then(response => { return response.json() })
            .then(data => {
                const contents = data["layouts"].sort((a, b) =>
                    (a["page_number"] > b["page_number"]) ? 1 : -1
                )

                for (let i = 0; i < contents.length; i++) {
                    const groups = contents[i]["boxes"];
                    for (let j = 0; j < groups.length; j++) {
                        groups[j]["checked"] = false;
                    }
                }

                this.setState({ contents: contents, segmentLoading: data["segmenting"] }, () => {
                    this.updateTextMode();
                });
            });
    }

	componentDidMount() {
        this.getLayouts();
		this.interval = setInterval(() => {
			if (!this.state.segmentLoading) return;
            this.getLayouts();
		}, 5000);  // TODO: should be replaced with WebSocket to receive info when done
	}

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!prevState.uncommittedChanges && this.state.uncommittedChanges) {
            window.addEventListener('beforeunload', this.preventExit);
        } else if (prevState.uncommittedChanges && !this.state.uncommittedChanges) {
            window.removeEventListener('beforeunload', this.preventExit);
        }
    }

    componentWillUnmount() {
        if (this.interval)
            clearInterval(this.interval);
    }

    /*
	addBoxToAllPages(box) {
		var contents = this.state.contents;
		for (var i = 0; i < contents.length; i++) {
			if (this.state.currentPage - 1 === i) continue;
			contents[i]["boxes"].push(box);
		}
		this.setState({ contents: contents });
	}
     */

	changePage(newPage) {
        if (isNaN(newPage) || Number(newPage) < 1 || Number(newPage) > this.state.contents.length) return;

		this.setState({ currentPage: Number(newPage) }, () => {
			this.updateTextMode();
		});
	}

    firstPage() {
        const boxes = this.image.current.getPageBoxes();
        const contents = this.state.contents;
        contents[this.state.currentPage - 1]["boxes"] = boxes;

        this.setState({ currentPage: 1, contents: contents }, () => {
            this.updateTextMode();
        });
    }

    lastPage() {
        const boxes = this.image.current.getPageBoxes();
        const contents = this.state.contents;
        contents[this.state.currentPage - 1]["boxes"] = boxes;

        this.setState({ currentPage: this.state.contents.length, contents: contents }, () => {
            this.updateTextMode();
        });
    }

	updateBoxes(groups) {
		const contents = this.state.contents;
		contents[this.state.currentPage - 1]["boxes"] = groups;

		groups.forEach((currentPageGroup) => {
            if (currentPageGroup["copyId"] !== undefined) {
                contents.forEach((page, i) => {
                    const otherPageBoxes = page["boxes"];
                    otherPageBoxes.forEach((group, j) => {
                        if (group["copyId"] !== undefined && group["copyId"] === currentPageGroup["copyId"]) {
                            const groupSquares = group["squares"];
                            const currentSquares = currentPageGroup["squares"];
                            if (groupSquares.length === 1) {
                                groupSquares[0]["top"] = currentSquares[0]["top"];
                                groupSquares[0]["left"] = currentSquares[0]["left"];
                                groupSquares[0]["bottom"] = currentSquares[0]["bottom"];
                                groupSquares[0]["right"] = currentSquares[0]["right"];
                            } else for (const k in groupSquares) {
                                groupSquares[k]["top"] = currentSquares[k]["top"];
                                groupSquares[k]["left"] = currentSquares[k]["left"];
                                groupSquares[k]["bottom"] = currentSquares[k]["bottom"];
                                groupSquares[k]["right"] = currentSquares[k]["right"];
                            }
                            group["groupId"] = (i + 1) + "." + (j + 1);
                        }
                    });
                });
            }
        });

		this.setState({ contents: contents, uncommittedChanges: true });
    }

	typeIndexToGlobalIndex(boxes, type, index) {
		for (var i = 0; i < boxes.length; i++) {
			if (boxes[i]["type"] === type) {
				index -= 1;
				if (index === 0) {
					return i;
				}
			}
		}
	}

    /*
	deleteBox(type, index) {
		var boxes = this.image.current.getAllBoxes();
		var contents = this.state.contents;
		boxes.splice(this.typeIndexToGlobalIndex(boxes, type, index), 1);
		contents[this.state.currentPage - 1]["boxes"] = boxes;

		this.setState({ contents: contents, uncommittedChanges: true }, () => {
            window.addEventListener('beforeunload', this.preventExit);
            this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	changeBoxType(index, previousType, newType) {
		var contents = this.state.contents;
		var pageBoxes = this.image.current.getAllBoxes();

		var globalIndex = this.typeIndexToGlobalIndex(pageBoxes, previousType, index);
		var box = pageBoxes[globalIndex];
		pageBoxes.splice(globalIndex, 1);
		box["type"] = newType;

		for (var i = pageBoxes.length - 1; i >= 0; i--) {
			if (pageBoxes[i]["type"] === newType) {
				pageBoxes.splice(i + 1, 0, box);
				break;
			}
		}
		if (i === -1) {
			pageBoxes.push(box);
		}

		contents[this.state.currentPage - 1]["boxes"] = pageBoxes;
		this.setState({ contents: contents, uncommittedChanges: true }, () => {
            window.addEventListener('beforeunload', this.preventExit);
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	boxDragged(type, box, yCoord) {
		var boxes, container;
		if (type === "text") {
			boxes = this.boxRefs;
			container = this.textBox
		} else if (type === "image") {
			boxes = this.imageRefs;
			container = this.imageBox;
		} else if (type === "remove") {
			boxes = this.ignoreRefs;
			container = this.ignoreBox;
		}

		yCoord -= container.current.offsetTop;

		var spacingBox = Math.max(Math.floor((yCoord - 20) / 48), 0);

		for (var i = 0; i < boxes.length; i++) {
			boxes[i].current.setSpacing(false);
			boxes[i].current.setLastSpacing(false);
		}

		var found = false;
		for (i = 0; i < boxes.length; i++) {
			if (i === box) continue;
			if (spacingBox === 0) {
				boxes[i].current.setSpacing(true);
				found = true;
				break;
			}
			spacingBox -= 1;
		}

		if (!found) {
			boxes[boxes.length - 1].current.setLastSpacing(true);
		}
	}

	boxDropped(type, boxIndex, yCoord) {
		var boxes, container;
		if (type === "text") {
			boxes = this.boxRefs;
			container = this.textBox
		} else if (type === "image") {
			boxes = this.imageRefs;
			container = this.imageBox;
		} else if (type === "remove") {
			boxes = this.ignoreRefs;
			container = this.ignoreBox;
		}

		for (var i = 0; i < boxes.length; i++) {
			boxes[i].current.setSpacing(false);
			boxes[i].current.setLastSpacing(false);
		}

		var contents = this.state.contents;
		var pageBoxes = this.image.current.getAllBoxes();

		var globalIndex = this.typeIndexToGlobalIndex(pageBoxes, type, boxIndex + 1);
		var box = pageBoxes[globalIndex];

		pageBoxes.splice(globalIndex, 1);

		yCoord -= container.current.offsetTop;
		var spacingBox = Math.max(Math.floor((yCoord - 20) / 48), 0);

		for (var j = 0; j < pageBoxes.length; j++) {
			if (pageBoxes[j]["type"] === type) {
				spacingBox -= 1;
				if (spacingBox === -1) {
					break;
				}
			}
		}

		pageBoxes.splice(j, 0, box);
		contents[this.state.currentPage - 1]["boxes"] = pageBoxes;

		this.setState({ contents: contents, uncommittedChanges: true }, () => {
            window.addEventListener('beforeunload', this.preventExit);
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	createBoxLine(box, type, index) {
		return {
			id: box.id || type[0].toUpperCase() + this.state.currentPage + "." + index,
			pxs: `${Math.round(box.right - box.left)} x ${Math.round(box.bottom - box.top)}`,
			type: type,
			size: box
		}
	}

	generateBoxes() {
		const boxes = this.state.contents[this.state.currentPage - 1]["boxes"];
		const newBoxes = [];

		for (let i = 0; i < boxes.length; i++) {
			const type = boxes[i]["type"] || "text";
			const box = this.createBoxLine(boxes[i], type, i + 1);
			newBoxes.push(box);
		}

		this.setState({ boxes: newBoxes });
	}
    */

	goBack() {
		if (this.state.uncommittedChanges) {
			this.confirmLeave.current.toggleOpen();
		} else {
			window.removeEventListener('beforeunload', this.preventExit);
			this.props.closeLayoutMenu();
		}
	}

	leave() {
		window.removeEventListener('beforeunload', this.preventExit);
		this.props.closeLayoutMenu();
		this.confirmLeave.current.toggleOpen();
	}

	saveLayout(closeWindow = false) {
        const path = (this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
		axios.post(API_URL + '/save-layouts',
            {
                _private: this.props._private,
                path: (this.props._private ? this.props.spaceId + '/' + path : path),
                layouts: this.state.contents
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
			.then(({ data }) => {
				if (data["success"]) {
                    this.setState({ uncommittedChanges: false });

					this.successNotifRef.current.openNotif("Segmentação guardada com sucesso");

					if (closeWindow) {
						this.leave();
					}
				} else if (data["segmenting"]) {
                    this.errorNotifRef.current.openNotif("Segmentação automática em curso");
				} else {
                    this.errorNotifRef.current.openNotif("Problema inesperado ao guardar a segmentação");
				}
			})
            .catch(err => {
                this.errorNotifRef.current.openNotif("Ocorreu um erro ao guardar a segmentação");
                this.setState({ segmentLoading: false });
            });
	}

	GenerateLayoutAutomatically() {
		this.setState({ segmentLoading: true });
		this.successNotifRef.current.openNotif("A segmentar automaticamente... Por favor aguarde");

        const path = (this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
		axios.get(API_URL + '/generate-automatic-layouts', {
            params: {
                _private: this.props._private,
                path: (this.props._private ? this.props.spaceId + '/' + path : path),
            },
        })
            .then(({ data }) => {
                if (data["layouts"] !== undefined) {
                    const contents = data["layouts"].sort((a, b) =>
                        (a["page_number"] > b["page_number"]) ? 1 : -1
                    );
                    this.setState({ contents: contents, segmentLoading: data["segmenting"] });
                } else if (data["segmenting"]) {
                    this.successNotifRef.current.openNotif("A segmentação irá demorar mais do que esperado");
                } else {
                    this.errorNotifRef.current.openNotif("Problema inesperado ao pedir a segmentação");
                }
			})
            .catch(err => {
                this.errorNotifRef.current.openNotif("Ocorreu um erro na segmentação");
                this.setState({ segmentLoading: false });
            });
	}

	cleanAllBoxes() {
        if (this.state.segmentLoading) return;
		const contents = [...this.state.contents];
		for (let i in contents) {
			contents[i]["boxes"] = [];
		}
		this.setState({ contents: contents, uncommittedChanges: true });
	}

	commitAllCheckBoxes(e) {
		var contents = this.state.contents;
		var boxes = contents[this.state.currentPage - 1]["boxes"];

		for (var i = 0; i < boxes.length; i++) {
			boxes[i]["checked"] = e.target.checked;
		}

		this.setState({ contents: contents });
	}

	changeChecked(e, index) {
		const contents = this.state.contents;
		const boxes = [...contents[this.state.currentPage - 1]["boxes"]];
		boxes[index]["checked"] = e.target.checked;
        contents[this.state.currentPage - 1]["boxes"] = boxes;
        /*
		// Get types of all boxes checked
		const types = [];
		for (var i = 0; i < boxes.length; i++) {
			if (boxes[i]["checked"] && !types.includes(boxes[i]["type"])) {
				types.push(boxes[i]["type"]);
			}
		}

		if (types.length === 1) {
			this.setState({ typeSelected: types[0] });
		} else {
			this.setState({ typeSelected: "" });
		}
         */

		this.setState({ contents: contents });
	}

	allCheckboxesAreChecked() {
		var contents = this.state.contents;
		if (contents.length === 0) return false;
		if (contents[this.state.currentPage - 1] === undefined) return false;

		var boxes = contents[this.state.currentPage - 1]["boxes"];
		if (boxes.length === 0) return false;

		for (var i = 0; i < boxes.length; i++) {
			if (!boxes[i]["checked"]) {
				return false;
			}
		}

		return true;
	}

	renameGroups(groups, page) {
		for (let i = 0; i < groups.length; i++) {
            groups[i]["groupId"] = page + "." + (i + 1);
            const boxes = groups[i]["squares"];
            for (let j = 0; j < boxes.length; j++) {
                let id;
                if (boxes.length === 1) {
                    id = page + "." + (i + 1);
                } else {
                    id = page + "." + (i + 1) + "." + (j + 1);
                }
                boxes[j]["id"] = id;
            }
		}
		return groups;
	}

    reorderBoxes(old_index, new_index) {
        const contents = this.state.contents;
        // create new array with box removed
        const pageContents = [...contents[this.state.currentPage - 1]["boxes"]];
        const elementToMove = pageContents[old_index];
        pageContents.splice(old_index, 1);
        // place box in new location
        pageContents.splice(new_index, 0, elementToMove);
        // recalculate IDs and replace page data
        contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(pageContents, this.state.currentPage);
        this.setState({ contents: contents, uncommittedChanges: true });
    }

	deleteCheckedBoxes() {
		var contents = this.state.contents;
		var boxes = contents[this.state.currentPage - 1]["boxes"];

		var keeping = [];

		for (var i = 0; i < boxes.length; i++) {
			if (!boxes[i]["checked"]) {
				keeping.push(boxes[i]);
			}
		}

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(keeping, this.state.currentPage);
		this.setState({ contents: contents, uncommittedChanges: true });
	}

	makeBoxCopy() {
		var contents = this.state.contents;
		var groups = contents[this.state.currentPage - 1]["boxes"];

		for (var i = 0; i < groups.length; i++) {
			if (groups[i].checked) {
				let copyId = groups[i]["copyId"] || uuidv4();
				groups[i]["copyId"] = copyId;
				groups[i]["checked"] = false;

				for (var j = 0; j < contents.length; j++) {
					var c_groups = contents[j]["boxes"];
					if (!c_groups.some(e => e["copyId"] === copyId)) {
						// Create an independent copy of the group
						var group = JSON.parse(JSON.stringify(groups[i]));

						c_groups.push(group);
						contents[j]["boxes"] = this.renameGroups(c_groups, j + 1);
					}
				}
			}
		}

		this.setState({ contents: contents, uncommittedChanges: true });
	}

    newGroup(newGroupData) {
        const contents = this.state.contents;
        const pageBoxes = [...contents[this.state.currentPage - 1]["boxes"]];
        pageBoxes.push(newGroupData);
        contents[this.state.currentPage - 1]["boxes"] = pageBoxes;
        this.setState({ contents: contents, uncommittedChanges: true });
    }

	groupCheckedBoxes() {
		var contents = this.state.contents;
		var groups = contents[this.state.currentPage - 1]["boxes"];

		var newGroups = [];
		var joined = [];
		var insertIndex = -1;
		for (var i = 0; i < groups.length; i++) {
			if (groups[i].checked) {
				if (insertIndex === -1) {
					insertIndex = i;
				}
				joined = joined.concat(groups[i]["squares"]);
			} else {
				newGroups.push(groups[i]);
			}
		}

		var newGroup = {
			type: "text",
			squares: joined,
			checked: false,
		}

		newGroups.splice(insertIndex, 0, newGroup);

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(newGroups, this.state.currentPage);
		this.setState({ contents: contents, uncommittedChanges: true });
	}

	splitCheckedBoxes() {
		var contents = this.state.contents;
		var groups = contents[this.state.currentPage - 1]["boxes"];

		var newGroups = [];

		for (var i = 0; i < groups.length; i++) {
			if (groups[i].checked) {
				for (var j = 0; j < groups[i]["squares"].length; j++) {
					newGroups.push({
						type: "text",
						squares: [groups[i]["squares"][j]],
						checked: false,
					});
				}
			} else {
				newGroups.push(groups[i]);
			}
		}

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(newGroups, this.state.currentPage);

		this.setState({ contents: contents, uncommittedChanges: true });
	}

    /*
	updateCheckBoxType(type) {
		this.setState({ typeSelected: type });

		var contents = this.state.contents;
		var groups = contents[this.state.currentPage - 1]["boxes"];

		for (var i = 0; i < groups.length; i++) {
			if (groups[i].checked) {
				groups[i]["type"] = type;
			}
		}

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(groups, this.state.currentPage);

		this.setState({ contents: contents }, () => {
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	goUp(index) {
		var contents = this.state.contents;
		var groups = contents[this.state.currentPage - 1]["boxes"];

		var group = groups[index];
		groups.splice(index, 1);
		groups.splice(index - 1, 0, group);

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(groups, this.state.currentPage);

		this.setState({ contents: contents }, () => {
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	goDown(index) {
		var contents = this.state.contents;
		var groups = contents[this.state.currentPage - 1]["boxes"];

		var group = groups[index];
		groups.splice(index, 1);
		groups.splice(index + 1, 0, group);

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(groups, this.state.currentPage);

		this.setState({ contents: contents });
	}
     */

	switchType(box) {
		const contents = this.state.contents;
		const groups = [...contents[this.state.currentPage - 1]["boxes"]];

		const group = groups[box];
		const newType = group["type"] === "image" ? (this.state.textModeState ? "text" : "remove") : "image";
		group["type"] = newType;

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(groups, this.state.currentPage);
		this.setState({ contents: contents, uncommittedChanges: true });
	}

	switchMode() {
		const contents = this.state.contents;
		const groups = [...contents[this.state.currentPage - 1]["boxes"]];

		for (let i in groups) {
			if (groups[i]["type"] !== "image") {
				groups[i]["type"] = this.state.textModeState ? "remove" : "text";
			}
		}

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(groups, this.state.currentPage);

		this.setState({ contents: contents, uncommittedChanges: true, textModeState: !this.state.textModeState });
	}

	updateTextMode() {
		const contents = this.state.contents;
		const groups = contents[this.state.currentPage - 1]["boxes"];

		let mode = true;
		for (let i = 0; i < groups.length; i++) {
			if (groups[i]["type"] === "text") break;
			else if (groups[i]["type"] === "remove") {
				mode = false;
				break;
			}
		}
		this.setState({ textModeState: mode });
	}

	render() {
        const loaded = this.state.contents.length !== 0;
        let tableData = [];

		let noCheckBoxActive = false;
        let groupDisabled = false;
        let separateDisabled = false;
        let copyDisabled = false;

        const cannotAutoSegmentFile = cannotAutoSegment.has(this.props.filename.split('.').pop())
        const autoSegmentDisabled = !loaded || this.state.segmentLoading || cannotAutoSegmentFile;
        const cleanAllDisabled = !loaded || this.state.segmentLoading;
        const saveDisabled = !loaded || !this.state.uncommittedChanges || this.state.segmentLoading;

		if (loaded) {
            tableData = this.state.contents[this.state.currentPage - 1]["boxes"];

            noCheckBoxActive = !this.state.contents[this.state.currentPage - 1]["boxes"].some(e => e["checked"]);
            groupDisabled = noCheckBoxActive
                            || this.state.contents[this.state.currentPage - 1]["boxes"].some(e => e["checked"] && e["copyId"] !== undefined)
                            || this.state.contents[this.state.currentPage - 1]["boxes"].map(e => e["checked"]).filter(Boolean).length <= 1
                            || this.state.contents[this.state.currentPage - 1]["boxes"].some(e => e["checked"] && e["type"] !== "text");
			separateDisabled = noCheckBoxActive
                            || this.state.contents[this.state.currentPage - 1]["boxes"].some(e => e["checked"] && e["squares"].length === 1 && e["copyId"] === undefined);
			copyDisabled = noCheckBoxActive
                            || this.state.contents[this.state.currentPage - 1]["boxes"].some(e => e["checked"] && e["squares"].length !== 1)
			// var typeDisabled = noCheckBoxActive || this.state.contents[this.state.currentPage - 1]["boxes"].some(e => e["checked"] && e["copyId"] !== undefined)
		}

		return (
			<>
				<Notification message={""} severity={"success"} ref={this.successNotifRef} />
                <Notification message={""} severity={"error"} ref={this.errorNotifRef}/>
				<ConfirmLeave leaveFunc={this.leave} ref={this.confirmLeave} />
                <Box className="toolbar">
                    <Box className="noMarginRight" sx={{display: "flex"}}>
                        <ReturnButton
                            disabled={false}
                            returnFunction={this.goBack}
                        />

                        <Typography
                            variant="h5"
                            component="h2"
                            className="toolbarTitle"
                        >
                            Segmentar o documento
                        </Typography>
                    </Box>

					<Box>
                        <Tooltip
                            placement="top"
                            title={
                                this.state.segmentLoading
                                    ? "O documento está a ser segmentado pelo servidor"
                                : "A obter informação do servidor"
                            }
                            disableFocusListener={!cleanAllDisabled}
                            disableHoverListener={!cleanAllDisabled}
                            disableTouchListener={!cleanAllDisabled}
                        ><span>
						<Button
                            disabled={cleanAllDisabled}
							variant="contained"
                            className="menuFunctionButton"
							onClick={() => this.cleanAllBoxes()}
							startIcon={<DeleteRoundedIcon />}
						>
							Limpar Tudo
						</Button>
                        </span></Tooltip>

                        <Tooltip
                            placement="top"
                            title={
                                this.state.segmentLoading
                                    ? "O documento está a ser segmentado pelo servidor"
                                : cannotAutoSegmentFile
                                    ? "Não é possível segmentar automaticamente este formato de ficheiro"
                                : "A obter informação do servidor"
                            }
                            disableFocusListener={!autoSegmentDisabled}
                            disableHoverListener={!autoSegmentDisabled}
                            disableTouchListener={!autoSegmentDisabled}
                        ><span>
						<Button
							disabled={autoSegmentDisabled}
							variant="contained"
                            className="menuFunctionButton"
                            style={{pointerEvents: "auto"}  /* ensures disabled button can show title */}
							onClick={() => this.GenerateLayoutAutomatically()}
						>
							Segmentar automaticamente
							{
								this.state.segmentLoading
									? <CircularProgress sx={{ ml: "10px" }} size={20} />
									: null
							}
						</Button>
                        </span></Tooltip>

                        <Tooltip
                            placement="top"
                            title={
                                this.state.segmentLoading
                                    ? "O documento está a ser segmentado pelo servidor"
                                : !this.state.uncommittedChanges
                                    ? "Não há alterações"
                                : "A obter informação do servidor"
                            }
                            disableFocusListener={!saveDisabled}
                            disableHoverListener={!saveDisabled}
                            disableTouchListener={!saveDisabled}
                        ><span>
						<Button
                            disabled={saveDisabled}
							variant="contained"
                            className="menuFunctionButton"
							color="success"
							startIcon={<SaveIcon />}
							onClick={() => this.saveLayout()}
						>
							Guardar
						</Button>
                        </span></Tooltip>

                        <Tooltip
                            placement="top"
                            title={
                                this.state.segmentLoading
                                    ? "O documento está a ser segmentado pelo servidor"
                                : !this.state.uncommittedChanges
                                    ? "Não há alterações"
                                : "A obter informação do servidor"
                            }
                            disableFocusListener={!saveDisabled}
                            disableHoverListener={!saveDisabled}
                            disableTouchListener={!saveDisabled}
                        ><span>
						<Button
                            disabled={saveDisabled}
							variant="contained"
							color="success"
                            className="menuFunctionButton noMarginRight"
                            startIcon={<CheckRoundedIcon />}
							onClick={() => this.saveLayout(true)}
						>
							Terminar
						</Button>
                        </span></Tooltip>
					</Box>
				</Box>

                {
                loaded
                ? <Box
                      className="menuContent"
                      sx={{
					     display: "flex",
					     flexDirection: "row",
                      }}
                >
					<Box sx={{
						display: 'flex',
						flexDirection: 'column',
                        width: '67%'
					}}>
						<Box sx={{display: "flex", flexDirection: "row"}}>
							{
								!loaded
									? null
									: <LayoutImage ref={this.image}
                                                   segmentLoading={this.state.segmentLoading}
                                                   textModeState={this.state.textModeState}
                                                   boxesCoords={this.state.contents[this.state.currentPage - 1]["boxes"]}
                                                   key={this.state.currentPage - 1}
                                                   pageIndex={this.state.currentPage}
                                                   imageURL={this.state.contents[this.state.currentPage - 1]["page_url"]}
                                                   updateBoxes={this.updateBoxes}
                                                   newGroup={this.newGroup}/>
							}
						</Box>

						<Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: '5px'
						}}>
                            <Box sx={{display: "flex", marginLeft: "auto", marginRight: "auto"}}>
                                <IconButton
                                    disabled={this.state.currentPage === 1}
                                    sx={{marginRight: "10px", p: 0}}
                                    onClick={() => this.firstPage()}
                                >
                                    <FirstPageIcon />
                                </IconButton>

                                <IconButton
                                    disabled={this.state.currentPage === 1}
                                    sx={{marginRight: "10px", p: 0}}
                                    onClick={() => this.changePage(this.state.currentPage - 1)}
                                >
                                    <KeyboardArrowLeftIcon />
                                </IconButton>

                                <span style={{display: "flex"}}>
                                    Página
                                    &nbsp;
                                    {this.state.contents.length === 1
                                        ? this.state.currentPage

                                        : <NumberField.Root
                                            value={this.state.currentPage}
                                            onValueChange={(value) => this.changePage((value))}
                                            step={1}
                                            smallStep={1}
                                            min={1}
                                            max={this.state.contents.length}
                                            className="pageNumberInput"
                                        >
                                            <NumberField.Input className="pageNumberInput"/>
                                        </NumberField.Root>
                                    }
                                    &nbsp;/ {this.state.contents.length}
                                </span>

                                <IconButton
                                    disabled={this.state.currentPage === this.state.contents.length}
                                    sx={{marginLeft: "10px", p: 0}}
                                    onClick={() => this.changePage(this.state.currentPage + 1)}
                                >
                                    <KeyboardArrowRightIcon />
                                </IconButton>

                                <IconButton
                                    disabled={this.state.currentPage === this.state.contents.length}
                                    sx={{marginLeft: "10px", p: 0}}
                                    onClick={() => this.lastPage()}
                                >
                                    <LastPageIcon />
                                </IconButton>
                            </Box>
						</Box>
					</Box>

					<Box sx={{ display: "flex", flexDirection: "column", width: "33%", ml: "1rem" }}>
						<Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", alignItems: "center" }}>
							<Button
								disabled={copyDisabled}
								variant="text"
								startIcon={<ContentCopyIcon />}
								onClick={() => this.makeBoxCopy()}
								sx={{
									textTransform: 'none',
								}}
							>
								Replicar
							</Button>

							<Button
								disabled={groupDisabled}
								variant="text"
								startIcon={<CallMergeIcon />}
								onClick={() => this.groupCheckedBoxes()}
								sx={{
									textTransform: 'none',
								}}
							>
								Agrupar
							</Button>

							<Button
								disabled={separateDisabled}
								variant="text"
								startIcon={<CallSplitIcon />}
								onClick={() => this.splitCheckedBoxes()}
								sx={{
									textTransform: 'none',
								}}
							>
								Desagrupar
							</Button>

							<Button
								disabled={noCheckBoxActive}
								color="error"
								variant="text"
								startIcon={<DeleteRoundedIcon />}
								onClick={() => this.deleteCheckedBoxes()}
								sx={{
									textTransform: 'none',
								}}
							>
								Apagar
							</Button>

							<Switch
								checked={this.state.textModeState}
								onChange={() => this.switchMode()}
								sx={{
									"& .MuiSwitch-switchBase": {
										color: "#f00",
										'&.Mui-checked': {
											color: "#00f",
										}
									}
								}}
								size='small'
							/>
							<span>Ignorar/Extrair</span>
						</Box>

                        <LayoutTable data={tableData}
                                     reorderBoxes={this.reorderBoxes}
                                     textModeState={this.state.textModeState}
                                     confirmAllChecked={this.allCheckboxesAreChecked}
                                     commitAllCheckBoxes={this.commitAllCheckBoxes}
                                     changeChecked={this.changeChecked}
                                     switchType={this.switchType}
                        />
					</Box>
				</Box>

                :<Box sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <CircularProgress color="success" />
                </Box>
                }
			</>
		)
	}
}

LayoutMenu.defaultProps = {
    _private: false,
    spaceId: "",
    current_folder: null,
    filename: null,
    // functions:
    closeLayoutMenu: null
}

export default LayoutMenu;

import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import Switch from '@mui/material/Switch';

import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

import { Checkbox, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import loadComponent from '../../../utils/loadComponents';
const LayoutImage = loadComponent('LayoutMenu', 'LayoutImage');
const ConfirmLeave = loadComponent('EditingMenu', 'ConfirmLeave');
const Notification = loadComponent('Notification', 'Notifications');
const ZoomingTool = loadComponent('ZoomingTool', 'ZoomingTool');

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

		this.boxRefs = [];
		this.imageRefs = [];
		this.ignoreRefs = [];

		this.image = React.createRef();
		this.menu = React.createRef();
		this.confirmLeave = React.createRef();

		this.warningNot = React.createRef();
		this.successNot = React.createRef();
		this.textBox = React.createRef();
		this.imageBox = React.createRef();
		this.ignoreBox = React.createRef();

        this.leave = this.leave.bind(this);
        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
	}

	preventExit(event) {
		event.preventDefault();
		event.returnValue = '';
	}

	componentDidMount() {
        const path = (this.props.sessionId + '/' + this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
        const is_private = this.props._private ? '_private=true&' : '';
        fetch(process.env.REACT_APP_API_URL + 'get-layouts?' + is_private + 'path=' + path, {
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

				this.setState({ contents: contents }, () => {
					this.generateBoxes();
					this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
					this.updateTextMode();
				});
			});

		this.interval = setInterval(() => {
			if (!this.state.segmentLoading) return;

            const path = (this.props.sessionId + '/' + this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
            const is_private = this.props._private ? '_private=true&' : '';
            fetch(process.env.REACT_APP_API_URL + 'get-layouts?' + is_private + 'path=' + path, {
				method: 'GET'
			}).then(response => { return response.json() })
				.then(data => {
					if (data["layouts"].some(e => !e["done"])) return;

					const contents = data["layouts"].sort((a, b) =>
						(a["page_number"] > b["page_number"]) ? 1 : -1
					)

					for (let i = 0; i < contents.length; i++) {
						const groups = contents[i]["boxes"];
						for (let j = 0; j < groups.length; j++) {
							groups[j]["checked"] = false;
						}
					}

					this.setState({ contents: contents, segmentLoading: false }, () => {
						this.generateBoxes();
						this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
						this.updateTextMode();
					});
				});
		}, 1000);
	}

	addBoxToAllPages(box) {
		var contents = this.state.contents;
		for (var i = 0; i < contents.length; i++) {
			if (this.state.currentPage - 1 === i) continue;
			contents[i]["boxes"].push(box);
		}
		this.setState({ contents: contents });
	}

	changePage(increment) {
		const boxes = this.image.current.getAllBoxes();
		const contents = this.state.contents;
		contents[this.state.currentPage - 1]["boxes"] = boxes;

		const newCurrentPage = this.state.currentPage + increment;
		this.setState({ currentPage: newCurrentPage, contents: contents }, () => {
			this.generateBoxes();
			this.image.current.loadBoxes();
			this.updateTextMode();
		});
	}

    firstPage() {
        const boxes = this.image.current.getAllBoxes();
        const contents = this.state.contents;
        contents[this.state.currentPage - 1]["boxes"] = boxes;

        this.setState({ currentPage: 1, contents: contents }, () => {
            this.generateBoxes();
            this.image.current.loadBoxes();
            this.updateTextMode();
        });
    }

    lastPage() {
        const boxes = this.image.current.getAllBoxes();
        const contents = this.state.contents;
        contents[this.state.currentPage - 1]["boxes"] = boxes;

        this.setState({ currentPage: this.state.contents.length, contents: contents }, () => {
            this.generateBoxes();
            this.image.current.loadBoxes();
            this.updateTextMode();
        });
    }

	updateBoxes(groups) {
		const contents = this.state.contents;

		for (let i = 0; i < groups.length; i++) {
			const group = groups[i];

			for (let j = 0; j < group["squares"].length; j++) {
				const square = group["squares"][j];
				if (square.copyId) {
					delete square.copyId;
				}
			}
		}

		contents[this.state.currentPage - 1]["boxes"] = groups;

		// * Code to reflect changes in copy boxes (removed as requested per Prof. Borbinha's instructions)
		// for (i = 0; i < groups.length; i++) {
		//     group = groups[i];

		//     if (group["copyId"] !== undefined) {

		//         for (j = 0; j < contents.length; j++) {

		//             var c_boxes = contents[j]["boxes"];

		//             for (var k = 0; k < c_boxes.length; k++) {
		//                 if (c_boxes[k]["copyId"] === group["copyId"]) {
		//                     // Make an independent copy of the box
		//                     var newBox = JSON.parse(JSON.stringify(group));
		//                     newBox["id"] = c_boxes[k]["id"];
		//                     c_boxes[k] = newBox;

		//                     contents[j]["boxes"] = c_boxes;

		//                     break;
		//                 }
		//             }
		//         }
		//     }
		// }

		for (let i = 0; i < contents.length; i++) {
			contents[i]["boxes"] = this.renameGroups(contents[i]["boxes"], i + 1);
		}

		this.setState({ contents: contents, uncommittedChanges: true }, () => {
			this.generateBoxes();
			// this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});

		// this.setState({contents: contents, uncommittedChanges: true}, this.generateBoxes);
		window.addEventListener('beforeunload', this.preventExit);
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

	deleteBox(type, index) {
		var boxes = this.image.current.getAllBoxes();
		var contents = this.state.contents;
		boxes.splice(this.typeIndexToGlobalIndex(boxes, type, index), 1);
		contents[this.state.currentPage - 1]["boxes"] = boxes;

		this.setState({ contents: contents, uncommittedChanges: true }, () => {
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
			this.generateBoxes();
			window.addEventListener('beforeunload', this.preventExit);
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
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
			this.generateBoxes();
			window.addEventListener('beforeunload', this.preventExit);
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
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
			this.generateBoxes();
			window.addEventListener('beforeunload', this.preventExit);
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
        const path = (this.props.sessionId + '/' + this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
		fetch(process.env.REACT_APP_API_URL + 'save-layouts', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
                _private: this.props._private,
				path: path,
				layouts: this.state.contents
			})
		}).then(response => { return response.json() })
			.then(data => {
				if (data["success"]) {
					this.setState({ uncommittedChanges: false });

					this.successNot.current.setMessage("Layout guardado com sucesso.");
					this.successNot.current.open();

					if (closeWindow) {
						this.props.closeLayoutMenu();
					}
				} else {
					alert("Erro inesperado ao guardar o layout.")
				}
			});
	}

	GenerateLayoutAutomatically() {
		this.setState({ segmentLoading: true });
		this.successNot.current.setMessage("A gerar layouts automaticamente... Por favor aguarde.");
		this.successNot.current.open();

        const path = (this.props.sessionId + '/' + this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
        const is_private = this.props._private ? '_private=true&' : '';
		fetch(process.env.REACT_APP_API_URL + 'generate-automatic-layouts?' + is_private + 'path=' + path, {
			method: 'GET'
		}).then(response => { return response.json() })
			.then(data => {
				var contents = data["layouts"].sort((a, b) =>
					(a["page_number"] > b["page_number"]) ? 1 : -1
				)

				this.setState({ contents: contents, segmentLoading: false }, () => {
					this.generateBoxes();
					this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
				});
			});
	}

	cleanAllBoxes() {
		var contents = this.state.contents;
		for (var i = 0; i < contents.length; i++) {
			contents[i]["boxes"] = [];
		}
		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	showWarningNotification(message) {
		this.warningNot.current.setMessage(message);
		this.warningNot.current.open();
	}

	commitAllCheckBoxes(e) {
		var contents = this.state.contents;
		var boxes = contents[this.state.currentPage - 1]["boxes"];

		for (var i = 0; i < boxes.length; i++) {
			boxes[i]["checked"] = e.target.checked;
		}

		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	changeChecked(e, index) {
		var contents = this.state.contents;
		var boxes = contents[this.state.currentPage - 1]["boxes"];
		boxes[index]["checked"] = e.target.checked;

		// Get types of all boxes checked
		var types = [];
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


		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
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
		var textGroups = groups.filter(e => e["type"] === "text");
		var imageGroups = groups.filter(e => e["type"] === "image");
		var ignoreGroups = groups.filter(e => e["type"] === "remove");

		for (var l_id in [textGroups, imageGroups, ignoreGroups]) {
			var l = [textGroups, imageGroups, ignoreGroups][l_id];
			for (var i = 0; i < l.length; i++) {
				var boxes = l[i]["squares"];
				for (var j = 0; j < boxes.length; j++) {
					let id;
					if (boxes.length === 1) {
						id = l[i].type[0].toUpperCase() + (page) + "." + (i + 1);
					} else {
						id = l[i].type[0].toUpperCase() + (page) + "." + (i + 1) + "." + (j + 1);
					}
					boxes[j]["id"] = id;
				}
			}
		}


		groups = textGroups.concat(imageGroups).concat(ignoreGroups);

		return groups;
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
		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
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

		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
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
		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
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

		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

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
			this.generateBoxes();
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
			this.generateBoxes();
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

		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	switchType(box) {
		var contents = this.state.contents;
		var groups = contents[this.state.currentPage - 1]["boxes"];

		var group = groups[box];
		var newType = group["type"] === "image" ? (this.state.textModeState ? "text" : "remove") : "image";
		group["type"] = newType;

		groups[box] = group;
		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(groups, this.state.currentPage);

		this.setState({ contents: contents }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
	}

	switchMode() {
		var contents = this.state.contents;
		var groups = contents[this.state.currentPage - 1]["boxes"];

		for (var i = 0; i < groups.length; i++) {
			if (groups[i]["type"] !== "image") {
				groups[i]["type"] = this.state.textModeState ? "remove" : "text";
			}
		}

		contents[this.state.currentPage - 1]["boxes"] = this.renameGroups(groups, this.state.currentPage);

		this.setState({ contents: contents, textModeState: !this.state.textModeState }, () => {
			this.generateBoxes();
			this.image.current.updateBoxes(this.state.contents[this.state.currentPage - 1]["boxes"]);
		});
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

		console.log(mode);

		this.setState({ textModeState: mode });
	}

    zoomIn() {
        this.image.current.zoomIn();
    }

    zoomOut() {
        this.image.current.zoomOut();
    }

	render() {
		let noCheckBoxActive = false;
        let groupDisabled = false;
        let separateDisabled = false;
        let copyDisabled = false;
		if (this.state.contents.length !== 0) {
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
				<Notification message={""} severity={"warning"} ref={this.warningNot} />
				<Notification message={""} severity={"success"} ref={this.successNot} />
				<ConfirmLeave leaveFunc={this.leave} ref={this.confirmLeave} />
				<Box sx={{
					ml: '0.5rem',
					mr: '0.5rem',
					display: 'flex',
					flexDirection: 'row',
					flexWrap: 'wrap',
					justifyContent: 'space-between',
					position: 'sticky',
					top: 0,
					zIndex: 100,
					backgroundColor: '#fff',
					paddingBottom: '1rem',
					marginBottom: '0.5rem',
					borderBottom: '1px solid black',
				}}>
					<Button
						variant="contained"
						startIcon={<UndoIcon />}
						onClick={() => this.goBack()}
						sx={{
							border: '1px solid black',
							height: '2rem',
							textTransform: 'none',
							fontSize: '0.75rem',
							backgroundColor: '#ffffff',
							color: '#000000',
							':hover': { bgcolor: '#ddd' }
						}}
					>
						Voltar
					</Button>

					<Box>
						<Button
							variant="contained"
                            className="menuFunctionButton"
							onClick={() => this.cleanAllBoxes()}
							startIcon={<DeleteRoundedIcon />}
						>
							Limpar Tudo
						</Button>
						<Button
							disabled={this.state.segmentLoading}
							variant="contained"
                            className="menuFunctionButton"
							onClick={() => this.GenerateLayoutAutomatically()}
						>
							Segmentar automaticamente
							{
								this.state.segmentLoading
									? <CircularProgress sx={{ ml: "10px" }} size={20} />
									: null
							}
						</Button>
						<Button
							variant="contained"
                            className="menuFunctionButton"
							color="success"
							startIcon={<SaveIcon />}
							onClick={() => this.saveLayout()}
						>
							Guardar
						</Button>
						<Button
							variant="contained"
							color="success"
                            className="menuFunctionButton noMargin"
                            startIcon={<CheckRoundedIcon />}
							onClick={() => this.saveLayout(true)}
						>
							Terminar
						</Button>
					</Box>
				</Box>

				<Box ref={this.menu} sx={{
					display: "flex",
					flexDirection: "row",
                    ml: "1rem",
                    mr: "1rem"
				}}>
					<Box sx={{
						display: 'flex',
						flexDirection: 'column',
					}}>
						<Box sx={{display: "flex", flexDirection: "row"}}>
							{
								this.state.contents.length === 0
									? null
									: <LayoutImage ref={this.image}
                                                   menu={this}
                                                   boxesCoords={this.state.contents[this.state.currentPage - 1]["boxes"]}
                                                   key={this.state.currentPage - 1}
                                                   pageIndex={this.state.currentPage}
                                                   image={this.state.contents[this.state.currentPage - 1]["page_url"]} />
							}
						</Box>
						<Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: '5px'
						}}>
                            <ZoomingTool zoomInFunc={this.zoomIn} zoomOutFunc={this.zoomOut}/>

                            <Box sx={{marginLeft: "auto", marginRight: "auto"}}>
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
                                    onClick={() => this.changePage(-1)}
                                >
                                    <KeyboardArrowLeftIcon />
                                </IconButton>

                                <span style={{margin: "0px 10px"}}>
                                    Página {this.state.currentPage} / {this.state.contents.length}
                                </span>

                                <IconButton
                                    disabled={this.state.currentPage === this.state.contents.length}
                                    sx={{marginLeft: "10px", p: 0}}
                                    onClick={() => this.changePage(1)}
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

					<Box sx={{ display: "flex", flexDirection: "column", width: "100%", ml: '0.5rem', mr: '0.5rem' }}>
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
							<span>Ignorar/Extrair OCR</span>
						</Box>

						<TableContainer sx={{ width: "100%", maxHeight: `${window.innerHeight - 217}px`, border: '1px solid #aaa' }}>
							<Table stickyHeader>
								<TableHead>
									<TableRow>
										<TableCell align='center' sx={{ borderBottom: '1px solid #aaa' }}>
											<Checkbox checked={this.allCheckboxesAreChecked()} sx={{ m: 0, p: 0 }} onChange={(e) => this.commitAllCheckBoxes(e)} />
										</TableCell>
										<TableCell align='center' sx={{ borderBottom: '1px solid #aaa' }}><b>ID</b></TableCell>
										<TableCell align='center' sx={{ borderBottom: '1px solid #aaa' }}><b>Pixels</b></TableCell>
										<TableCell align='center' sx={{ borderBottom: '1px solid #aaa' }}><b>Tipo</b></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{
										this.state.contents.length === 0 || this.state.contents[this.state.currentPage - 1] === undefined
											? null
											: this.state.contents[this.state.currentPage - 1]["boxes"].map((group, index) => {
												return (
                                                <TableRow key={index + " " + group.checked} sx={{ borderBottom: '1px solid #aaa' }}>
													<TableCell align='center' sx={{ borderBottom: '1px solid #aaa', p: "4px 16px" }}>
														<Checkbox checked={group.checked} sx={{ m: 0, p: 0 }} onClick={(e) => this.changeChecked(e, index)} />
													</TableCell>
													<TableCell align='center' sx={{ borderBottom: '1px solid #aaa', p: "4px 16px" }}>
														<Box>
															{
																group["squares"].map((box, _index) => {
																	return (
																		<Box
																			key={box.id + " " + group["copyId"]}
																			sx={{
																				backgroundColor: group.type === "text" ? "#0000ff" : group.type === "image" ? '#08A045' : '#F05E16',
																				borderRadius: '10px',
																				justifyContent: 'center',
																				display: 'flex',
																				color: '#fff',
																				margin: '0.25rem',
																				alignItems: 'center',
																			}}
																		>
																			{box.id}

																			{
																				group["copyId"]
																					? <ContentCopyIcon sx={{ fontSize: 15, ml: "10px" }} />
																					: null
																			}
																		</Box>
																	);
																})
															}
														</Box>
													</TableCell>
													<TableCell align='center' sx={{ borderBottom: '1px solid #aaa', p: "4px 16px" }}>
														<Box sx={{ display: "flex", flexDirection: "column" }}>
															{
																group.squares.map((box, _index) => {
																	return (<span>{Math.ceil(box.bottom - box.top)} x {Math.ceil(box.right - box.left)}</span>);
																})
															}
														</Box>
													</TableCell>
													<TableCell align='center' sx={{ borderBottom: '1px solid #aaa', p: "4px 16px" }}>
														{
															this.state.textModeState
																? <span>Texto</span>
																: <span>Remover</span>
														}
														<Switch
															size="small"
															checked={group.type === "image"}
															onChange={() => this.switchType(index)}
															sx={{
																"& .MuiSwitch-switchBase": {
																	color: this.state.textModeState ? "#00f" : "#f05e16",
																	'&.Mui-checked': {
																		color: "#08A045",
																	}
																}
															}}
														/>
														<span>Imagem</span>
													</TableCell>
												</TableRow>)
											})
									}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				</Box>
			</>
		)
	}
}

LayoutMenu.defaultProps = {
    _private: false,
    sessionId: ""
}

export default LayoutMenu;

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandle } from "./DragHandle";
import styled from "styled-components";
import {Checkbox, TableCell, TableRow} from "@mui/material";
import Box from "@mui/material/Box";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Switch from "@mui/material/Switch";

const DraggingRow = styled.td`
  height: 1rem;
  padding: 16px;
  background: rgba(127, 207, 250, 0.3);
`;

export const DraggableTableRow = ({ group, index, textModeState, changeChecked, switchType }) => {
    const {
        attributes,
        listeners,
        transform,
        transition,
        setNodeRef,
        isDragging
    } = useSortable({
        id: group.groupId
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition
    };
    return (
        <TableRow
            ref={setNodeRef}
            key={group._uniq_id}
            style={style}
            className='layoutRow'
        >
            {isDragging ? <DraggingRow colSpan={4}>&nbsp;</DraggingRow>
            : [
                <TableCell align='center' className='layoutCell' sx={{width: '15%'}}>
                    <DragHandle {...attributes} {...listeners} />
                    <Checkbox checked={group.checked} sx={{m: 0, p: 0}}
                              onClick={(e) => changeChecked(e, index)}/>
                </TableCell>,
                <TableCell align='center' className='layoutCell' sx={{width: '17.5%'}}>
                    <Box>
                        {
                            group.squares.map((box, _index) => {
                                return (
                                    <Box
                                        key={box.id + " " + group.copyId}
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
                                        {
                                            (group.type === "text"
                                                ? "T"
                                                : (group.type === "image"
                                                    ? "I"
                                                    : "R")) + box.id
                                        }
                                        {
                                            group.copyId
                                                ? <ContentCopyIcon
                                                    sx={{fontSize: 15, ml: "10px"}}/>
                                                : null
                                        }
                                    </Box>
                                );
                            })
                        }
                    </Box>
                </TableCell>,
                <TableCell align='center' className='layoutCell'>
                    <Box sx={{display: "flex", flexDirection: "column"}}>
                        {
                            group.squares.map((box, _index) => {
                                return (
                                    <span>{Math.ceil(box.bottom - box.top)} x {Math.ceil(box.right - box.left)}</span>);
                            })
                        }
                    </Box>
                </TableCell>,
                <TableCell align='center' className='layoutCell'>
                    {
                        textModeState || group.squares.length > 1
                            ? <span>Texto</span>
                            : <span>Remover</span>
                    }
                    <Switch
                        size="small"
                        disabled={group.squares.length > 1}  // disable type change for grouped boxes; can only group text
                        checked={group.type === "image"}
                        onChange={() => switchType(index)}
                        sx={{
                            "& .MuiSwitch-switchBase": {
                                color: group.squares.length > 1 ? "#808080" : (textModeState ? "#00f" : "#f05e16"),
                                '&.Mui-checked': {
                                    color: "#08A045",
                                }
                            }
                        }}
                    />
                    <span>Imagem</span>
                </TableCell>
            ]}
        </TableRow>
    );
};

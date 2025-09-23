import React from "react";
import { DragHandle } from "./DragHandle";
import styled from "styled-components";
import {Checkbox, TableCell} from "@mui/material";
import Box from "@mui/material/Box";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Switch from "@mui/material/Switch";

const StyledStaticTableRow = styled.tr`
  box-shadow: rgb(0 0 0 / 10%) 0px 20px 25px -5px,
    rgb(0 0 0 / 30%) 0px 10px 10px -5px;
  outline: #3e1eb3 solid 1px;
`;

export const StaticTableRow = ({ group, textModeState }) => {
    return (
        <StyledStaticTableRow>
        {
            [
            <TableCell align='center' className='layoutCell' sx={{width: '15%'}}>
                <DragHandle isDragging />
                <Checkbox checked={group.checked} sx={{m: 0, p: 0}}
                          disabled={true}  // disable checkbox for row being dragged
                          onClick={null}/>
            </TableCell>,
            <TableCell align='center' className='layoutCell no-text-select' sx={{width: '17.5%'}}>
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
                                        paddingLeft: '6px',
                                        paddingRight: '6px',
                                        alignItems: 'center',
                                        fontWeight: '700',
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
                                                sx={{fontSize: 15, ml: "5px"}}/>
                                            : null
                                    }
                                </Box>
                            );
                        })
                    }
                </Box>
            </TableCell>,
            <TableCell align='center' className='layoutCell no-text-select'>
                <Box sx={{display: "flex", flexDirection: "column"}}>
                    {
                        group.squares.map((box, _index) => {
                            return (
                                <span>{Math.ceil(box.bottom - box.top)} x {Math.ceil(box.right - box.left)}</span>);
                        })
                    }
                </Box>
            </TableCell>,
            <TableCell align='center' className='layoutCell no-text-select'>
                {
                    textModeState || group.squares.length > 1
                        ? <span>Texto</span>
                        : <span>Remover</span>
                }
                <Switch
                    size="small"
                    disabled={true}  // disable type change for row being dragged
                    checked={group.type === "image"}
                    onChange={null}
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
            ]
        }
        </StyledStaticTableRow>
    );
};

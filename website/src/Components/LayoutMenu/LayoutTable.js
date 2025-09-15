import React, {useMemo, useState} from "react";
import {Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {restrictToVerticalAxis} from "@dnd-kit/modifiers";
import {SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";

import {DraggableTableRow} from './DraggableTableRow';
import {StaticTableRow} from './StaticTableRow';

const LayoutTable = ({
        data = [],
        // functions:
        reorderBoxes,
        textModeState,
        confirmAllChecked,
        commitAllCheckBoxes,
        changeChecked,
        switchType
        }) => {

    const [activeId, setActiveId] = useState(null);
    const [dropPosition, setDropPosition] = useState(undefined);
    const groupIds = useMemo(() => data?.map((group) => group.groupId), [data]);

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    );

    function handleDragStart(event) {
        setActiveId(event.active.id);
    }

    function handleDragEnd(event) {
        const { active, over } = event;
        if (over?.id) {
            if (active.id !== over.id) {
                setDropPosition({
                    top: `${over.rect.top}px`,
                    left: `${over.rect.left}px`,
                });
                //reorderBoxes(items.findIndex((group) => group.id === active.id), items.findIndex((group) => group.id === over.id));
                reorderBoxes(groupIds.indexOf(active.id), groupIds.indexOf(over.id));
            }
        }
        setActiveId(null);
        requestAnimationFrame(() => setDropPosition(undefined));
    }

    function handleDragCancel() {
        setActiveId(null);
    }

    const selectedGroup = useMemo(() => {
        if (!activeId) {
            return null;
        }
        const row = data.find((group) => group.groupId === activeId);
        return row ? row : null;
    }, [activeId, data]);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
        >
            <TableContainer sx={{width: "100%", maxHeight: '69vh', border: '1px solid #aaa'}}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow className='layoutHeaderRow'>
                            <TableCell align='center' className='layoutHeaderCell'>
                                <Checkbox checked={confirmAllChecked()} sx={{m: 0, p: 0}}
                                          onChange={(e) => commitAllCheckBoxes(e)}/>
                            </TableCell>
                            <TableCell align='center' className='layoutHeaderCell'><b>ID</b></TableCell>
                            <TableCell align='center' className='layoutHeaderCell'><b>Pixels</b></TableCell>
                            <TableCell align='center' className='layoutHeaderCell'><b>Tipo</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                        {
                            !data || data.length === 0
                                ? null
                                : data.map((group, index) => {
                                    return (
                                        <DraggableTableRow
                                            group={group}
                                            index={index}
                                            textModeState={textModeState}
                                            changeChecked={changeChecked}
                                            switchType={switchType}
                                        />);
                                })
                        }
                        </SortableContext>
                    </TableBody>
                </Table>
                <DragOverlay
                    dropAnimation={{
                        keyframes: (resolver) => {
                            return [
                                {/*
                                    transform:
                                        `translate3d(${resolver.transform.initial.x}px,
                                        ${resolver.transform.initial.y}px, 0)`,
                                },
                                {
                                    ...(dropPosition
                                        ? {position: "fixed", top: "0", left: "0"}
                                        : {}),
                                    transform:
                                        dropPosition
                                            ? `translate3d(${dropPosition?.x},
                                            ${dropPosition?.y}, 0)`
                                            : `translate3d(${resolver.transform.final.x}px,
                                            ${resolver.transform.final.y}px, 0)`,
                                    transform:
                                        dropPosition
                                            ? `translate3d(${dropPosition?.x},
                                            ${dropPosition?.y}, 0)`
                                            : `translate3d(${resolver.dragOverlay.rect.left}px,
                                            ${resolver.dragOverlay.rect.top}px, 0)`,
                                    */
                                    transform:
                                            `translate3d(${resolver.dragOverlay.rect.left}px,
                                            ${resolver.dragOverlay.rect.top}px, 0)`,
                                },
                            ];
                        },
                    }}>
                    {activeId ? (
                        <Table style={{ width: '100%' }}>
                            <TableBody>
                                <StaticTableRow group={selectedGroup} textModeState={textModeState}/>
                            </TableBody>
                        </Table>
                    ) : null}
                </DragOverlay>
            </TableContainer>
        </DndContext>
    );
}

export default LayoutTable;

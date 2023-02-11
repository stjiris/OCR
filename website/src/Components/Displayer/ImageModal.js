import React, { useRef, useMemo, useEffect, useState, useImperativeHandle } from "react";
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { forwardRef } from "react";

const SCROLL_SENSITIVITY = 0.0005;
const MAX_ZOOM = 5;
const MIN_ZOOM = 0.1;

class ImageModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            image: props.image
        }
    }

    handleOpen() {
        this.setState({open: true});
    }

    handleClose() {
        this.setState({open: false});
    }

    render() {
        return (
            <Modal
                open={this.state.open}
                onClose={() => this.handleClose()}
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <img
                        className="modal-image"
                        src={this.state.image}
                        alt={this.state.image}
                    />
                </Box>
            </Modal>
        );
    }
}

const ZoomImage = forwardRef(( { image } , ref) => {
    const [open, setOpen] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [draggind, setDragging] = useState(false);

    const touch = useRef({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const observer = useRef(null);
    const background = useMemo(() => new Image(), [image]);

    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    const handleClose = () => {
        setOpen(false);
    }

    useImperativeHandle(ref, () => ({
        handleOpen() {
            setOpen(true);
            draw();
        }
    }));

    const handleWheel = (event) => {
        const { deltaY } = event;
        if (!draggind) {
            setZoom((zoom) =>
                clamp(zoom + deltaY * SCROLL_SENSITIVITY * -1, MIN_ZOOM, MAX_ZOOM)
            );
        }
    };

    const handleMouseMove = (event) => {
        if (draggind) {
        const { x, y } = touch.current;
        const { clientX, clientY } = event;
        setOffset({
            x: offset.x + (x - clientX),
            y: offset.y + (y - clientY),
        });
        touch.current = { x: clientX, y: clientY };
        }
    };

    const handleMouseDown = (event) => {
        const { clientX, clientY } = event;
        touch.current = { x: clientX, y: clientY };
        setDragging(true);
    };

    const handleMouseUp = () => setDragging(false);

    const draw = () => {
        if (canvasRef.current) {
        const { width, height } = canvasRef.current;
        const context = canvasRef.current.getContext("2d");

        // Set canvas dimensions
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // Clear canvas and scale it
        context.translate(-offset.x, -offset.y);
        context.scale(zoom, zoom);
        context.clearRect(0, 0, width, height);

        // Make sure we're zooming to the center
        const x = (context.canvas.width / zoom - background.width) / 2;
        const y = (context.canvas.height / zoom - background.height) / 2;

        // Draw image
        context.drawImage(background, x, y);
        }
    };

    useEffect(() => {
        observer.current = new ResizeObserver((entries) => {
            entries.forEach(({ target }) => {
                const { width, height } = background;
                // If width of the container is smaller than image, scale image down
                if (target.clientWidth < width) {
                // Calculate scale
                const scale = target.clientWidth / width;

                // Redraw image
                canvasRef.current.width = width * scale;
                canvasRef.current.height = height * scale;
                canvasRef.current
                    .getContext("2d")
                    .drawImage(background, 0, 0, width * scale, height * scale);
                }
            });
        });

        if (containerRef.current) {
            observer.current.observe(containerRef.current);
            return () => observer.current.unobserve(containerRef.current);
        }

    }, []);

    useEffect(() => {
        background.src = image;

        if (canvasRef.current) {
        background.onload = () => {
            // Get the image dimensions
            const { width, height } = background;
            canvasRef.current.width = width;
            canvasRef.current.height = height;

            // Set image as background
            canvasRef.current.getContext("2d").drawImage(background, 0, 0);
        };
        }
    }, [background]);

    useEffect(() => {
        draw();
    }, [zoom, offset]);

    return (
        <Modal
            open={open}
            onClose={handleClose}
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '90vw',
                maxHeight: '90vh',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <img
                    className="modal-image"
                    src={image}
                    alt={image}
                />
            </Box>
        </Modal>
    );
});

export {ZoomImage, ImageModal};
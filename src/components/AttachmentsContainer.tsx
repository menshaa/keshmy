import styles from "src/styles/attachments.module.scss";
import MediaModal from "src/components/MediaModal";
import { useEffect, useRef, useState } from "react";
import { Box, Grid, useDisclosure } from "@chakra-ui/react";

interface AttachmentsProps {
    urls: string[];
}

export default function Attachments({ urls }: AttachmentsProps) {
    const imagesRef = useRef<(HTMLDivElement | null)[]>([]);

    const [index, setIndex] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        e.stopPropagation();
        setIndex(index);
        onOpen();
    };

    useEffect(() => {
        imagesRef.current.forEach((imageRef, index) => {
            const bgImg = new Image();
            bgImg.src = urls[index];
            bgImg.onload = () => {
                if (imageRef) {
                    imageRef.style.backgroundColor = "#0000";
                    imageRef.style.backgroundImage = `url(${urls[index]})`;
                }
            };
        });
    }, [urls]);

    return (
        <>
            {urls.length && urls[0] ? (
                <Grid className={styles.imagesContainer}>
                    {urls.length == 2 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <Box
                                    ref={(r) => (imagesRef.current[0] = r)}
                                    className={`${styles.imageAttachment} ${styles.halfImageGrid2Images}`}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 0)}
                                ></Box>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <Box
                                    ref={(r) => (imagesRef.current[1] = r)}
                                    className={`${styles.imageAttachment} ${styles.halfImageGrid2Images}`}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 1)}
                                ></Box>
                            </div>
                        </>
                    ) : urls.length == 3 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <Box
                                    ref={(r) => (imagesRef.current[0] = r)}
                                    className={styles.imageAttachment}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 0)}
                                ></Box>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <Box
                                    ref={(r) => (imagesRef.current[1] = r)}
                                    className={styles.imageAttachment}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 1)}
                                ></Box>
                                <Box
                                    ref={(r) => (imagesRef.current[2] = r)}
                                    className={styles.imageAttachment}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 2)}
                                ></Box>
                            </div>
                        </>
                    ) : urls.length == 4 ? (
                        <>
                            <div className={styles.halfImageGrid}>
                                <Box
                                    ref={(r) => (imagesRef.current[0] = r)}
                                    className={styles.imageAttachment}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 0)}
                                ></Box>
                                <Box
                                    ref={(r) => (imagesRef.current[2] = r)}
                                    className={styles.imageAttachment}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 2)}
                                ></Box>
                            </div>
                            <div className={styles.halfImageGrid}>
                                <Box
                                    ref={(r) => (imagesRef.current[1] = r)}
                                    className={styles.imageAttachment}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 1)}
                                ></Box>
                                <Box
                                    ref={(r) => (imagesRef.current[3] = r)}
                                    className={styles.imageAttachment}
                                    width="full"
                                    style={{
                                        backgroundColor: "#777",
                                    }}
                                    onClick={(e) => handleClick(e, 3)}
                                ></Box>
                            </div>
                        </>
                    ) : (
                        <div className={styles.halfImageGrid}>
                            <Box
                                ref={(r) => (imagesRef.current[0] = r)}
                                className={styles.imageAttachment}
                                width="full"
                                style={{
                                    backgroundColor: "#777",
                                }}
                                onClick={(e) => handleClick(e, 0)}
                            ></Box>
                        </div>
                    )}
                </Grid>
            ) : null}
            <MediaModal isOpen={isOpen} onClose={onClose} mediaIndex={index} media={urls} />
        </>
    );
}

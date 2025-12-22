/**
 * Variantes de animación para el módulo de solicitud de permisos
 */

export const modalVariants = {
    hidden: {
        opacity: 0,
        backdropFilter: "blur(0px)",
    },
    visible: {
        opacity: 1,
        backdropFilter: "blur(8px)",
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
    exit: {
        opacity: 0,
        backdropFilter: "blur(0px)",
        transition: { duration: 0.2 },
    },
}

export const modalContentVariants = {
    hidden: {
        scale: 0.9,
        opacity: 0,
        y: 20,
    },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
            staggerChildren: 0.05,
        },
    },
    exit: {
        scale: 0.95,
        opacity: 0,
        y: 10,
        transition: { duration: 0.2 },
    },
}

export const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" },
    },
}

export const employeeCardVariants = {
    hover: {
        scale: 1.02,
        y: -2,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 25,
        },
    },
    tap: {
        scale: 0.98,
        transition: { duration: 0.1 },
    },
}

export const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
}

export const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut",
        },
    },
}

import type { Variants } from "framer-motion"

export const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.12,
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
        },
    },
}

export const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
        },
    },
}

export const formVariants: Variants = {
    hidden: { x: 40, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.6
        },
    },
    exit: {
        x: -40,
        opacity: 0,
        transition: { duration: 0.3 },
    },
}

export const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        backdropFilter: "blur(0px)"
    },
    visible: {
        opacity: 1,
        backdropFilter: "blur(12px)",
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        opacity: 0,
        backdropFilter: "blur(0px)",
        transition: { duration: 0.3 }
    }
}

export const modalContentVariants: Variants = {
    hidden: {
        scale: 0.85,
        opacity: 0,
        y: 60
    },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 25,
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    },
    exit: {
        scale: 0.9,
        opacity: 0,
        y: 30,
        transition: { duration: 0.25 }
    }
}

export const optionCardVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
        },
    },
    hover: {
        y: -12,
        scale: 1.03,
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94]
        },
    },
    tap: {
        scale: 0.97,
        transition: { duration: 0.15 },
    },
}

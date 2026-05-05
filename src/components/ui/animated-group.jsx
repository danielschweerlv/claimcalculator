import { motion } from 'framer-motion'
import React from 'react'

const defaultContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const defaultItemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export function AnimatedGroup({ children, className, variants, disableAnimation = false, animateOnMount = false }) {
  const containerVariants = variants?.container ?? defaultContainerVariants
  const itemVariants = variants?.item ?? defaultItemVariants

  if (disableAnimation) {
    return (
      <div className={className}>
        {React.Children.map(children, (child, index) => (
          <div key={index}>{child}</div>
        ))}
      </div>
    )
  }

  // animateOnMount: use animate instead of whileInView — needed for above-the-fold elements
  // where IntersectionObserver may miss the initial trigger (React 19 StrictMode + lazy loading)
  if (animateOnMount) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={className}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={containerVariants}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

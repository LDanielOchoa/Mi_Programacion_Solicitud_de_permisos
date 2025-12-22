'use client'

import { motion } from 'framer-motion';

const WelcomeBar = ({ userName = "Usuario" }) => {
  return (
    <motion.div 
      className="bg-white shadow-md rounded-lg p-4 mb-8 flex justify-between items-center"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h2 className="text-2xl font-bold text-green-700">Bienvenido, {userName}</h2>
        <p className="text-green-600">¿Qué deseas hacer hoy?</p>
      </div>
      <div className="flex space-x-4">
      </div>
    </motion.div>
  );
};

export default WelcomeBar;


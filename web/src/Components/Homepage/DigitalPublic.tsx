import React from 'react';
import { motion } from 'framer-motion';
import './Dashboard.scss';
import publicGoodImage from "../../Assets/Images/public-good.jpg";

const DigitalPublicGood = () => {
  return (
    <div className="digital-public-good">
      <h2 className="section-title">A Digital Public Good</h2>
      
      <div className="image-containers">
        <img src={publicGoodImage} alt="A Digital Public Good" className="main-image" />

        <motion.div
          className="image-caption"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.8, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          In response to countries’ need for support, UNDP has created the National Carbon Credit Registry as an open-source toolkit that follows the Digital Public Goods Standard. Countries can access the free, open-source code and installation instructions from UNDP’s managed Github to customize a Registry according to their national needs. This approach helps save time, reduce costs, and avoids duplication of effort.
        </motion.div>
      </div>
    </div>
  );
};

export default DigitalPublicGood;

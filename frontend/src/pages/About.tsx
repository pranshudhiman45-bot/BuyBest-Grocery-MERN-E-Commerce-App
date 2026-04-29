import { motion } from "framer-motion";

const About = () => {
  return (
    <motion.div
      className="max-w-5xl mx-auto px-6 py-10"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        About Us
      </motion.h1>

      <motion.p
        className="text-gray-700 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Welcome to our store! We are dedicated to making your grocery shopping simple, fast, and reliable.
      </motion.p>

      <motion.p
        className="text-gray-700 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Our journey began with a clear goal — to provide fresh, high-quality groceries at affordable prices, delivered right to your doorstep. We understand how important quality and freshness are when it comes to food, which is why we carefully source our products from trusted suppliers and local farmers.
      </motion.p>

      <motion.p
        className="text-gray-700 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        From fresh fruits and vegetables to daily essentials, we ensure that every item meets our quality standards before it reaches you.
      </motion.p>

      <motion.p
        className="text-gray-700 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        We are committed to delivering a seamless shopping experience with easy ordering, timely delivery, and excellent customer support.
      </motion.p>

      <motion.p
        className="text-gray-700 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        Our mission is to make everyday grocery shopping convenient while maintaining trust, quality, and affordability.
      </motion.p>

      <motion.p
        className="text-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        Thank you for choosing us as your trusted grocery partner.
      </motion.p>
    </motion.div>
  );
};

export default About;

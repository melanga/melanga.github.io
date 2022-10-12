import React from "react";
import tw from "twin.macro";
import {
  SiTensorflow,
  SiScikitlearn,
  SiPython,
  SiJavascript,
  SiTailwindcss,
  SiFlutter,
  SiGit,
  SiReact,
  SiFirebase,
} from "react-icons/si";
import { motion } from "framer-motion";

const TechnologiesWrapper = tw(motion.div)`
  grid sm:grid-cols-3 grid-cols-2 ml-6
`;

const Technology = tw(motion.div)`
  flex flex-row justify-start items-center mb-6
`;

const TecIcon = tw.div`
  text-white text-lg pr-4 
`;

const TecName = tw.p`
  text-lg text-white border-b-2 border-b-cyan-500 
`;

const TechDetails = [
  {
    icon: <SiTensorflow />,
    name: "TensorFlow",
  },
  {
    icon: <SiScikitlearn />,
    name: "Scikitlearn",
  },
  {
    icon: <SiPython />,
    name: "Python",
  },
  {
    icon: <SiFlutter />,
    name: "Flutter",
  },
  {
    icon: <SiFirebase />,
    name: "Firebase",
  },
  {
    icon: <SiGit />,
    name: "Git",
  },
  {
    icon: <SiReact />,
    name: "React",
  },
  {
    icon: <SiTailwindcss />,
    name: "Tailwindcss",
  },
  {
    icon: <SiJavascript />,
    name: "Javascript",
  },
];

export default function TecSection({ variants }) {
  return (
    <TechnologiesWrapper variants={variants}>
      {TechDetails.map((item) => (
        <Technology
          key={item.name}
          whileHover={{ scale: 1.1 }}
          transition={{
            type: "spring",
            damping: 7,
            mass: 2.5,
            stiffness: 300,
          }}
        >
          <TecIcon>{item.icon}</TecIcon>
          <TecName>{item.name}</TecName>
        </Technology>
      ))}
    </TechnologiesWrapper>
  );
}

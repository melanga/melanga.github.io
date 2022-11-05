import React from "react";
import tw from "twin.macro";
import Typed from "typed.js";
import styled from "styled-components";
import backgroundImage from "../../images/background_image.jpeg";
import NavBar from "../../components/NavBar";
import { Link } from "react-scroll";
import { BsArrowDownCircle } from "react-icons/bs";
import { motion, useTransform, useViewportScroll } from "framer-motion";

const TopSectionContainer = styled.div`
  ${tw`
    w-full flex h-screen
`}
`;

const LandingSection = styled(motion.div)`
  ${tw`
        w-full h-screen flex flex-col justify-items-center
    `};
  background-image: url(${backgroundImage}),
    linear-gradient(to left, #6e15801d, #114264);
  background-size: cover;
  background-position: bottom 10% left;
  background-blend-mode: overlay;
`;

const InfoSection = styled(motion.div)`
  ${tw`
    absolute top[150px] left-4 sm:right-40 sm:left-auto 2xl:right-40 2xl:top[180px]
  `}
`;

const FloatingText = styled(motion.div)`
  ${tw`
    m-0 font-black text-white sm:mb-2
    font-size[60px] line-height[60px]
    sm:font-size[80px] sm:line-height[70px] 
    md:font-size[100px] md:line-height[80px] 
    lg:font-size[125px] lg:line-height[100px]
    2xl:font-size[145px] 2xl:line-height[130px]
    font-family["Ubuntu"]
    flex items-center
  `}
`;

const OutlinedTextSvg = styled.svg`
  //font: bold 100px Century "Archivo Narrow", Arial;
  ${tw`
        width[fit-content]
        sm:width[auto]
        height[70px]
        sm:height[100px]
        2xl:width[550px]
        flex
        sm:mt-1
        2xl:mt-4
    `};
  overflow: overlay;
  text {
    max-height: 100%;
    flex: 1;
    fill: none;
    stroke: white;
    stroke-width: 1px;
    stroke-linejoin: round;
    z-index: 99;
    ${tw`
      sm:transform[translateY(60px)]
      md:transform[translateY(72px)]
      lg:transform[translateY(97px)]
      2xl:transform[translateY(100px)]
      transform[translateY(50px)]
    `};
    text-shadow: 0px 0px 0px rgba(255, 255, 255, 0.5);
  }
`;

const DescriptionText = styled(motion.div)`
  ${tw`
    text-base md:text-lg text-white text-opacity-80 mt-2 sm:mt-10 2xl:mt-20 max-w-lg 2xl:max-w-xl mr-4 sm:ml-1.5
  `}
`;

const ViewMoreButton = styled(motion.button)`
  ${tw`
    absolute bottom-6 self-center text-white text-4xl
  `}
`;

const TopSection = ({ isTablet }) => {
  // Create reference to store the DOM element containing the animation
	const el = React.useRef(null);
  // Create reference to store the Typed instance itself
	const typed = React.useRef(null);

  React.useEffect(() => {
    const options = {
    	strings: [
        'Developer',
        'Enthusiast',
        'Programmer',
      ],
      typeSpeed: 50,
      backSpeed: 50,
      loop: true,
    };
    
    // elRef refers to the <span> rendered below
    typed.current = new Typed(el.current, options);
    
    return () => {
      // Make sure to destroy Typed instance during cleanup
      // to prevent memory leaks
      typed.current.destroy();
    }
  }, [])

  const animationProps = {
    hidden: { opacity: 0, y: -20 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.5,
        duration: 0.7,
      },
    },
  };

  const { scrollY } = useViewportScroll();
  const factor = isTablet ? 0.3 : -0.2;
  const yBody = useTransform(scrollY, (value) => value * factor);
  const yNav = useTransform(scrollY, (value) => value * 1);

  return (
    <TopSectionContainer>
      <LandingSection variants={animationProps} animate="show" initial="hidden">
        <NavBar variants={animationProps} style={{ y: yNav }} />
        <InfoSection style={{ y: yBody }}>
          <FloatingText variants={animationProps}>Hi,</FloatingText>
          <FloatingText
            variants={animationProps}
            style={{ display: "inline-flex" }}
          >
            I'm&nbsp;
          </FloatingText>
          <FloatingText
            variants={animationProps}
            animate={{ color: ["#1990be", "#19bea2", "#1990be"] }}
            transition={{
              ease: "easeOut",
              duration: 5,
              repeat: Infinity,
            }}
            style={{ display: "inline-flex" }}
          >
            Melanga
          </FloatingText>
          <FloatingText variants={animationProps}>
            <OutlinedTextSvg>
              <text ref={el}></text>
            </OutlinedTextSvg>
          </FloatingText>
          <DescriptionText variants={animationProps}>
            I'm Melanga Dissanayake, an undergraduate at the Uva
            Wellassa University of Sri Lanka pursuing my B.Sc. (Hons) in
            Industrial Information Technology.
          </DescriptionText>
        </InfoSection>
        <ViewMoreButton
          whileHover={{
            scale: 1.2,
            color: "#19bea2",
            transition: { duration: 0.3 },
          }}
          whileTap={{ scale: 0.9 }}
          variants={animationProps}
        >
          <Link to="About" smooth={"easeInOutQuad"} duration={1000}>
            <BsArrowDownCircle />
          </Link>
        </ViewMoreButton>
      </LandingSection>
    </TopSectionContainer>
  );
};

export default TopSection;

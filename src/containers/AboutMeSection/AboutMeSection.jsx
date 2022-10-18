import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { HeaderText } from "../../components/HeaderText";
import { ProfileImage } from "./ProfileImage";
import TecSection from "./TecSection";

const AboutMeSectionContainer = styled.div`
  ${tw`
      w-full flex md:h-screen justify-center
      bg-gradient-to-r from-blue-900 to-cyan-500
    `}
`;

const ContentWrapper = tw(motion.div)`
  flex flex-col self-center lg:max-width[1000px] 2xl:max-width[1200px] sm:height[80%] h-full
  mt-12 mb-12 mx-4 sm:mr-12 sm:ml-12 bg-opacity-10 bg-purple-800 border-radius[10px] sm:p-3
`;

const SectionColumn = styled.div`
  ${tw`
      self-center flex w-full md:flex-row flex-col p-6
    `}
`;

const SectionRowLeft = styled(motion.div)`
  ${tw`
      h-full md:flex[20%] flex[40%] justify-start relative pr-8
    `}
`;

const SectionRowRight = styled(motion.div)`
  ${tw`
      height[auto] mt-12 
      flex[60%] 2xl:flex[70%] 
      justify-start border-l-4 border-solid border-l-cyan-200
    `}
`;

const DescriptionWrapper = tw.div`
    justify-start pt-12 pl-6 pb-8 
`;

const Description = tw(motion.p)`
  text-base sm:text-lg md:text-lg text-white
`;

export default function AboutMeSection() {
  const animationProps = {
    hidden: { opacity: 0, y: -20 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        duration: 0.7,
      },
    },
  };

  return (
    <AboutMeSectionContainer id={"About"}>
      <ContentWrapper
        variants={animationProps}
        initial="hidden"
        whileInView={"show"}
      >
        <HeaderText text={"About Me"} />
        <SectionColumn>
          <SectionRowLeft variants={animationProps}>
            <ProfileImage variants={animationProps} />
          </SectionRowLeft>
          <SectionRowRight variants={animationProps}>
            <DescriptionWrapper>
              <Description variants={animationProps}>
                I'm Melanga Dissanayake and I am currently an undergraduate at the
                Uva Wellassa University of Sri Lanka pursuing my B.Sc. (Hons)
                in Industrial Information Technology.
                <br /> <br /> Software Engineering | Machine Learning | Mobile App Development are my interesting areas of study.
              </Description>
            </DescriptionWrapper>
            <TecSection variants={animationProps} />
          </SectionRowRight>
        </SectionColumn>
      </ContentWrapper>
    </AboutMeSectionContainer>
  );
}

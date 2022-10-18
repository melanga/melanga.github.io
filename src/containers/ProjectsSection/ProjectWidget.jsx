import tw from "twin.macro";
import React from "react";
import { useMediaQuery } from "react-responsive";
import { deviceSize } from "../../components/responsive";
import { FiGithub, FiLink } from "react-icons/fi";
import styled from "styled-components";

const ProjectsWrapper = styled.div`
  ${tw`
    p-4 flex flex-col justify-evenly relative w-full height[400px] 2xl:height[auto] bg-black/30 border-radius[10px]
  `}
  // tailwind styles were added dynamically
  ${({ imgLeft }) => (imgLeft ? tw`sm:flex-row` : tw`sm:flex-row-reverse`)}
`;

const ProjectImgWrapper = tw.div`
  flex flex[60%] relative 
  sm:position[unset]
`;

const MobileProjectImg = styled.div`
  ${tw`
    w-full height[400px] flex border-radius[10px] shadow-xl sm:position[unset] relative
  `};
  background-image: url(${({ projectImg }) => projectImg}),
    linear-gradient(to top left, rgba(91, 33, 182, 0), #0e7490);
  background-size: cover;
  background-blend-mode: darken;
`;

const ProjectImg = tw.img`
  flex width[100%] height[400px] sm:height[fit-content] border-radius[10px] shadow-lg 
  sm:position[unset] relative
`;

const ProjectCard = styled.div`
  ${tw`
    width[500px] p-3 bg-gradient-to-l from-blue-800 to-cyan-700 border-radius[10px] absolute top[40%] shadow-2xl
  `}
  ${({ imgLeft }) =>
    imgLeft
      ? tw`right[16px] bg-gradient-to-l`
      : tw`left[16px] bg-gradient-to-r`}
`;

const ProjectDetails = styled.div`
  ${tw`
    flex flex-col pt-12 flex[40%] text-sm sm:text-base
  `}
  ${({ imgLeft }) => (imgLeft ? tw`justify-items-end` : tw`justify-start`)}
`;

const ProjectTitle = styled.h2`
  ${tw`
    text-white text-xl font-bold text-align[end] sm:position[unset]
 `}
  ${({ imgLeft }) =>
    imgLeft
      ? tw`absolute top-10 left-6 sm:text-align[end] text-align[start]`
      : tw`absolute top-10 right-6 sm:text-align[start] text-align[end]`}
`;

const ProjectTechnologies = styled.p`
  ${tw`
    absolute text-white text-base tracking-widest sm:width[fit-content] width[auto]
    pr-4 sm:pr-0 sm:pt-8 
    sm:top[80px] 
    text-shadow[#000000 1px 0 10px] sm:text-shadow[none]
  `}
  ${({ imgLeft }) =>
    imgLeft
      ? tw`sm:right-4 sm:left[unset] sm:text-align[end] text-align[start] top-20 left-6 `
      : tw`sm:right[unset] sm:left-4 sm:pl-0 sm:text-align[start] text-align[end] top-20 right-6 pr-0 pl-4`}
`;

const ProjectDescription = styled.p`
  ${tw`
    text-white text-base pr-4 sm:pr-0
    sm:position[unset] absolute top[40%] 
    text-shadow[#000000 1px 0 10px] sm:text-shadow[none]
  `}
  ${({ imgLeft }) =>
    imgLeft
      ? tw`sm:text-align[end] text-align[start] left-6`
      : tw`sm:text-align[start] text-align[end] right-6 pr-0 pl-4 sm:pl-0`}
`;

const ProjectLinksWrapper = styled.div`
  ${tw`
    flex flex-row text-white text-2xl absolute gap-4
  `}
  ${({ imgLeft }) =>
    imgLeft
      ? tw`sm:bottom-16 sm:right-4 sm:left[unset] bottom-6 right[unset] left-6`
      : tw`sm:bottom-16 sm:left-4 sm:right[unset] bottom-6 left[unset] right-6`}
`;

export default function ProjectWidget({
  id,
  title,
  description,
  technologies,
  projectImg,
  gitHubUrl,
  imgLeft,
}) {
  const isMobile = useMediaQuery({ maxWidth: deviceSize.mobile });
  if (isMobile) {
    // mobile Widget
    return (
      <ProjectsWrapper imgLeft={imgLeft}>
        <MobileProjectImg projectImg={projectImg}></MobileProjectImg>
        <ProjectTitle imgLeft={imgLeft}>{title}</ProjectTitle>
        <ProjectTechnologies imgLeft={imgLeft}>
          {technologies}
        </ProjectTechnologies>
        <ProjectDescription imgLeft={imgLeft}>{description}</ProjectDescription>
        <ProjectLinksWrapper imgLeft={imgLeft}>
          <a href={gitHubUrl}><FiGithub/></a>
          <a href={gitHubUrl}><FiLink /></a>
        </ProjectLinksWrapper>
      </ProjectsWrapper>
    );
  } else {
    // desktop and tab widget
    return (
      <ProjectsWrapper imgLeft={imgLeft} id={id}>
        <ProjectImgWrapper>
          <ProjectImg src={projectImg}></ProjectImg>
        </ProjectImgWrapper>
        <ProjectDetails imgLeft={imgLeft}>
          <ProjectTitle imgLeft={imgLeft}>{title}</ProjectTitle>
          <ProjectTechnologies imgLeft={imgLeft}>
            {technologies}
          </ProjectTechnologies>
        </ProjectDetails>
        <ProjectCard imgLeft={imgLeft}>
          <ProjectDescription imgLeft={imgLeft}>
            {description}
          </ProjectDescription>
        </ProjectCard>
        <ProjectLinksWrapper imgLeft={imgLeft}>
          <a href={gitHubUrl}><FiGithub /></a>
          <a href={gitHubUrl}><FiLink /> </a>
        </ProjectLinksWrapper>
      </ProjectsWrapper>
    );
  }
}

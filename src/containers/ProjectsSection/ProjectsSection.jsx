import React from "react";
import tw from "twin.macro";
import { HeaderText } from "../../components/HeaderText";
import { Project1Data, Project2Data, Project3Data } from "./ProjectsDetails";
import ProjectWidget from "./ProjectWidget";

const ProjectsSectionContainer = tw.div`
  border-t-2 border-cyan-500 w-full flex bg-gradient-to-r from-blue-900 to-cyan-500 justify-center
`;

const ContentWrapper = tw.div`
  flex flex-col self-center lg:max-width[1000px] 2xl:max-width[1200px] h-full
  mt-12 mb-12 mx-4 sm:mr-12 sm:ml-12 border-radius[10px] relative w-full gap-4 sm:gap-16
`;

export default function ProjectsSection() {
  return (
    <ProjectsSectionContainer id={"Projects"}>
      <ContentWrapper>
        <HeaderText text={"Projects"} />
        <ProjectWidget {...Project1Data} imgLeft={true} />
        <ProjectWidget {...Project2Data} imgLeft={false} />
        <ProjectWidget {...Project3Data} imgLeft={true} />
      </ContentWrapper>
    </ProjectsSectionContainer>
  );
}

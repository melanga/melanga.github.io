import { motion } from "framer-motion";
import React from "react";
import tw from "twin.macro";
import profilePhoto from "../../images/profile_photo.jpg";

const ImgDiv = tw(motion.div)`
    relative m-0
`;

const ImageWrapper = tw.div`
    ml-12 mt-12 block after:absolute after:left-16 after:top-4 after:border-cyan-500
    after:border-4 after:border-radius[10px] 
    after:width[200px] after:height[200px]
    width[200px] height[200px]

`;

const ProfileImg = tw(motion.img)`
    relative
    width[100] height[100] border-radius[10px] z-10
`;

export const ProfileImage = ({ variants }) => {
  return (
    <ImgDiv variants={variants}>
      <ImageWrapper>
        <ProfileImg src={profilePhoto} variants={variants}></ProfileImg>
      </ImageWrapper>
    </ImgDiv>
  );
};

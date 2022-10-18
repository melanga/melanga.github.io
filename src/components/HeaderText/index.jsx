import React from "react";
import tw from "twin.macro";

const HeaderTxt = tw.h2`
  text-transparent bg-clip-text bg-gray-100 width[fit-content] whitespace-nowrap
  text-3xl lg:text-5xl  font-bold sm:m-0 text-shadow[#44444436 2px 1px 10px] text-align[start]
`;

const Header = tw.div`
  flex flex-row justify-start width[fit-content] md:width[53%] gap-2
`;

const HeaderLine = tw.div`
  w-full border-cyan-200 border self-center
`;

export const HeaderText = ({ text }) => {
  return (
    <Header>
      <HeaderTxt>{text}</HeaderTxt>
      <HeaderLine />
    </Header>
  );
};

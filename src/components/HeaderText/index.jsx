import React from "react";
import tw from "twin.macro";

const HeaderTxt = tw.h2`
  text-transparent bg-clip-text bg-gradient-to-tl from-purple-100 to-cyan-200 width[fit-content] whitespace-nowrap
  text-3xl font-bold sm:m-0 text-shadow[#44444436 2px 1px 10px] text-align[start]
`;

const Header = tw.div`
  flex flex-row justify-start width[fit-content] md:width[53%] gap-2
`;

const HeaderLine = tw.div`
  w-full border-purple-700 border self-center
`;

export const HeaderText = ({ text }) => {
  return (
    <Header>
      <HeaderTxt>{text}</HeaderTxt>
      <HeaderLine />
    </Header>
  );
};

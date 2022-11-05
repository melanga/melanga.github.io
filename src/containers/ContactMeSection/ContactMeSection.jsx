import React from "react";
import tw from "twin.macro";

const ContactMeSectionWrapper = tw.div`
    border-t-2 border-cyan-500  w-full flex h-screen bg-gradient-to-r from-blue-900 to-cyan-500 justify-center items-center
`;

const ContentWrapper = tw.div`
    mx-4 flex flex-col height[70%] width[max-content] p-4 sm:p-10 justify-center max-w-3xl gap-6
    bg-opacity-10 bg-purple-800 border-radius[10px]
`;

const TitleText = tw.h1`
    text-2xl sm:text-4xl font-black text-center text-yellow-50
`;

const Message = tw.p`
    text-base md:text-lg font-medium tracking-wider text-center text-white
`;

const MailButton = tw.a`
    bg-opacity-100 border-2 border-radius[10px] border-blue-500 width[fit-content] pt-2 pb-2 pl-6 pr-6 self-center text-white
    hover:bg-cyan-500/10
`;

const ContactMeSection = () => {
  return (
    <ContactMeSectionWrapper id="Contact Me">
      <ContentWrapper>
        <TitleText>Get in Touch</TitleText>
        <Message>
          Although I’m not currently looking for any new opportunities, my inbox
          is always open. Whether you have a question or just want to say hi,
          I’ll try my best to get back to you!
        </Message>
        <MailButton href="mailto:dissanayakedmmb@gmail.com">Say Hi</MailButton>
      </ContentWrapper>
    </ContactMeSectionWrapper>
  );
};

export default ContactMeSection;

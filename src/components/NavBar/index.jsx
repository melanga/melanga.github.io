import React from "react";
import styled from "styled-components";
import tw from "twin.macro";
import Logo from "../Logo";
import { slide as Menu } from "react-burger-menu";
import { Link } from "react-scroll";
import { useMediaQuery } from "react-responsive";
import { deviceSize } from "../responsive";
import { menuStyles } from "./menuStyles";
import { motion } from "framer-motion";

const NavbarContainer = styled(motion.div)`
  width: 90%;
  ${tw`
    flex h-20 pl-6 pr-6 pt-4 border-b-2 border-gray-200 border-opacity-50 items-center self-center
  `}
`;

const NavItems = styled.div`
  ${tw`
    list-none w-full h-auto md:h-full flex md:ml-20 justify-end items-center
  `}
`;

const NavItem = tw.div`
  mr-8 
  flex items-center justify-center min-h-full text-white cursor-pointer font-medium text-lg 
  sm:text-base 
  transition-colors transition-duration[300ms] hover:text-gray-300 box-content mb-4
  sm:mb-0
`;

export default function NavBar({ variants }) {
  const isMobile = useMediaQuery({ maxWidth: deviceSize.mobile });

  //! NavItem cannot get a Link
  const navItems = (
    <NavItems>
      <NavItem key="about">
        <Link to="About" smooth={"easeInOutQuad"} duration={1000}>
          About
        </Link>
      </NavItem>
      <NavItem key="projects">
        <Link to="Projects" smooth={"easeInOutQuad"} duration={1000}>
          Projects
        </Link>
      </NavItem>
      <NavItem key="contact">
        <Link to="Contact Me" smooth={"easeInOutQuad"} duration={1000}>
          Contact Me
        </Link>
      </NavItem>
    </NavItems>
  );

  return (
    <NavbarContainer variants={variants}>
      <Logo />
      {isMobile && (
        <Menu right styles={menuStyles}>
          {navItems}
        </Menu>
      )}
      {!isMobile && navItems}
    </NavbarContainer>
  );
}

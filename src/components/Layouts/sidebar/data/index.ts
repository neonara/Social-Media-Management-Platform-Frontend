import React, { JSX } from "react";
import * as Icons from "../icons";

export type NavItem = {
  title: string;
  url?: string;
  icon?: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  items: NavItem[];
  roles?: string[];
};

export const NAV_DATA: { label: string; items: NavItem[] }[] = [
  {
    label: "DASHBOARD",
    items: [
      {
        title: "Assignment Table",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Create User",
        url: "/create-user",
        icon: Icons.User,
        items: [],
        roles: ["administrator", "super_administrator", "moderator"], // Only admins can see this
      },
      // {
      //   title: "Assignment Table",
      //   url: "/assignmentTable",
      //   icon: Icons.User,
      //   items: [],
      //   roles: [], // Admins and managers can see this
      // },
      {
        title: "Users Table",
        url: "/usersTable",
        icon: Icons.User,
        items: [],
        roles: ["administrator", "super_administrator"], // Only admins can see this
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "Draft Posts",
        url: "/drafts",
        icon: Icons.Alphabet,
        items: [],
        roles: [
          "moderator",
          "community_manager",
          "admin",
          "super_administrator",
        ], // Only admins and managers can see this
      },
      {
        title: "Calendar",
        url: "/calendar",
        icon: Icons.Calendar,
        items: [],
      },
    ],
  },
  // {
  //   label: "Template Pages",
  //   items: [
  //     {
  //       title: "Forms",
  //       icon: Icons.Alphabet,
  //       items: [
  //         {
  //           title: "Form Elements",
  //           url: "/forms/form-elements",
  //         },
  //         {
  //           title: "Form Layout",
  //           url: "/forms/form-layout",
  //         },
  //       ],
  //     },
  //     {
  //       title: "Tables",
  //       url: "/tables",
  //       icon: Icons.Table,
  //       items: [
  //         {
  //           title: "Tables",
  //           url: "/tables",
  //         },
  //       ],
  //     },
  //     {
  //       title: "Pages",
  //       icon: Icons.Alphabet,
  //       items: [
  //         {
  //           title: "Settings",
  //           url: "/settings",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   label: "OTHERS",
  //   items: [
  //     {
  //       title: "Charts",
  //       icon: Icons.PieChart,
  //       items: [
  //         {
  //           title: "Basic Chart",
  //           url: "/charts/basic-chart",
  //         },
  //       ],
  //     },
  //   ],
  // },
];

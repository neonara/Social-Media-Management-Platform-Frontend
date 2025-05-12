import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "DASHBOARD",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Create User",
        url: "/create-user",
        icon: Icons.User,
        items: [],
        roles: ["administrator", "moderator"], // Only admins can see this
      },
      {
        title: "Assignment Table",
        url: "/assignmentTable",
        icon: Icons.User,
        items: [],
        roles: [], // Admins and managers can see this
      },
      {
        title: "Users Table",
        url: "/usersTable",
        icon: Icons.User,
        items: [],
        roles: ["administrator"], // Only admins can see this
      },
      {
        title: "Draft Posts",
        url: "/drafts",
        icon: Icons.Alphabet,
        items: [],
        roles: [],
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
  //           url: "/pages/settings",
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

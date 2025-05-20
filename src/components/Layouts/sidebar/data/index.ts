import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "DASHBOARD",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.HomeIcon,
        items: [
          {
            title:"Assignment Table",
        url: "/assignmentTable",
        items: [],
          },
          {
        title:"Users Table",
        url: "/usersTable",
        items: [],
      },
          
        ],
      },
      
      
    ],
  },
  {
    label: "Content",
    items: [
      
      {
        title: "Calendar",
        url: "/calendar",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "Draft Posts",
        url: "/drafts",
        icon: Icons.Alphabet, 
        items: [],
      },
    ],
  },
];

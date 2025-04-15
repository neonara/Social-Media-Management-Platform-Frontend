import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const assignments = [
  {
    name: "Luna Lovegood",
    role: "Community Manager",
    assignedTo: "Jane Doe", // Moderator
  },
  {
    name: "Harry Potter",
    role: "Community Manager",
    assignedTo: "John Smith", // Moderator
  },
  {
    name: "Bruce Wayne",
    role: "Moderator",
    assignedTo: "Wayne Enterprises", // Client
  },
  {
    name: "Tony Stark",
    role: "Moderator",
    assignedTo: "Stark Industries", // Client
  },
  {
    name: "Hermione Granger",
    role: "Community Manager",
    assignedTo: "Bruce Wayne", // Moderator
  },
]

export function AssignmentTable() {
  return (
    <div className="rounded-xl border bg-white shadow-sm p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead className="w-[150px]">Role</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead className="text-center w-[120px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    item.role === "Moderator"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {item.role}
                </span>
              </TableCell>
              <TableCell>{item.assignedTo}</TableCell>
              <TableCell className="text-center">
                <button className="rounded bg-primary px-3 py-1 text-sm font-medium text-white hover:bg-primary/90 transition">
                  Edit
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total Assignments</TableCell>
            <TableCell className="text-center">{assignments.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

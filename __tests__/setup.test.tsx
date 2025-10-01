import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock a simple component for testing
const TestComponent = () => {
    return (
        <div>
            <h1>Hello World</h1>
            <p>This is a test component</p>
        </div>
    )
}

describe('Test Setup', () => {
    it('renders test component correctly', () => {
        render(<TestComponent />)

        const heading = screen.getByRole('heading', { name: /hello world/i })
        const paragraph = screen.getByText(/this is a test component/i)

        expect(heading).toBeInTheDocument()
        expect(paragraph).toBeInTheDocument()
    })

    it('should pass a basic math test', () => {
        expect(2 + 2).toBe(4)
    })
})
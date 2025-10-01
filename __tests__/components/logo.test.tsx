import { Logo } from '@/components/logo'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

// Mock Next.js Image component
jest.mock('next/image', () => ({
	__esModule: true,
	default: (props: any) => {
		const { fill, priority, sizes, quality, ...imgProps } = props
		// eslint-disable-next-line @next/next/no-img-element
		return (
			<img
				{...imgProps}
				data-fill={fill}
				data-priority={priority}
				data-sizes={sizes}
				data-quality={quality}
			/>
		)
	},
}))

describe('Logo Component', () => {
	it('renders logo images correctly', () => {
		render(<Logo />)

		const logoImages = screen.getAllByAltText('NextAdmin logo')

		// Should render two logo images (light and dark mode versions)
		expect(logoImages).toHaveLength(2)

		// Check if both images have the correct role
		logoImages.forEach(img => {
			expect(img).toHaveAttribute('role', 'presentation')
		})
	})

	it('has correct CSS classes for light and dark mode', () => {
		render(<Logo />)

		const logoImages = screen.getAllByAltText('NextAdmin logo')

		// Light mode logo should have dark:hidden class
		expect(logoImages[0]).toHaveClass('dark:hidden')

		// Dark mode logo should have hidden and dark:block classes
		expect(logoImages[1]).toHaveClass('hidden')
		expect(logoImages[1]).toHaveClass('dark:block')
	})

	it('renders with correct container structure', () => {
		const { container } = render(<Logo />)

		const logoContainer = container.querySelector('.relative.h-16.max-w-50')
		expect(logoContainer).toBeInTheDocument()
	})
})
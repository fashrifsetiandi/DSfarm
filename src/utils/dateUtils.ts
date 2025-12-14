import { format } from 'date-fns'

/**
 * Calculate age from birth date in Indonesian format
 * @param birthDate - ISO date string (YYYY-MM-DD)
 * @returns Age string in format "2th 5bln 19hr"
 */
export function calculateAge(birthDate: string): string {
    const birth = new Date(birthDate)
    const today = new Date()

    // If birth date is in the future, return appropriate message
    if (birth > today) {
        return '0 hari'
    }

    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    let days = today.getDate() - birth.getDate()

    // Adjust if days are negative
    if (days < 0) {
        months--
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        days += lastMonth.getDate()
    }

    // Adjust if months are negative
    if (months < 0) {
        years--
        months += 12
    }

    // Format output based on age
    if (years === 0 && months === 0) {
        return `${days} hari`
    } else if (years === 0) {
        return `${months}bln ${days}hr`
    }
    return `${years}th ${months}bln ${days}hr`
}

/**
 * Format date to Indonesian readable format
 * @param date - ISO date string
 * @returns Formatted date like "15 Jan 2023"
 */
export function formatDate(date: string): string {
    return format(new Date(date), 'dd MMM yyyy')
}

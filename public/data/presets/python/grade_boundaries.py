# PRESET: Grade boundaries
# Turns a score (0 to 100) into a letter grade.
# NOTE: change the numbers below to match your school's grading rules.

score = int(input("Enter the score (0-100): "))

if score < 0 or score > 100:               # check the input first
    print("A score must be between 0 and 100.")
elif score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
elif score >= 60:
    print("Grade: D")
else:
    print("Grade: F")

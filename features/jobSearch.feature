Feature: Job search

  Scenario: Search for jobs by title, industry, and location
    Given I am on the job search home page
    When I search for "Software Testing" in "CIVIL Construction" near "Chennai"
    Then I should see job search results matching my search
    And the search URL should include the requested criteria
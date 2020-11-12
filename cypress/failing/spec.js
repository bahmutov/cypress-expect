/// <reference types="cypress" />

describe('1 passing 1 failing', () => {
  it('passes', () => {
    cy.wait(100)
  })

  it('fails', () => {
    expect(true).to.be.false
  })
})

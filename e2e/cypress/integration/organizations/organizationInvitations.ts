import {cleanOrganizationData, createOrganizationData, login} from "../../fixtures/apiCalls";
import {HOST} from "../../fixtures/constants";
import 'cypress-file-upload';
import {assertMessage, confirmStandard, gcy} from "../../fixtures/shared";
import {getAnyContainingText} from "../../fixtures/xPath";

describe('Organization Invitations', () => {
    beforeEach(async () => {
        await login().promisify()
        await cleanOrganizationData().promisify()
        await createOrganizationData().promisify()
        await visit();
    })

    it("generates invitations", () => {
        generateInvitation("MEMBER")

        gcy("organization-invitations-generated-field").within(() => {
            cy.get("textarea").should("contain.value", "http://")
        })

        generateInvitation("OWNER")
        generateInvitation("OWNER")
        generateInvitation("MEMBER")

        gcy("simple-hateoas-list").within(() => {
            cy.get("li").should("have.length", 4)
        })
        gcy("simple-hateoas-list").xpath("." + getAnyContainingText("MEMBER")).should("have.length", 2)
        gcy("simple-hateoas-list").xpath("." + getAnyContainingText("OWNER")).should("have.length", 2)
    })

    it("cancels invitation", () => {
        generateInvitation("MEMBER")
        generateInvitation("OWNER")

        gcy("simple-hateoas-list").xpath("." + getAnyContainingText("MEMBER")).closest("li").within(() => {
            gcy("organization-invitation-cancel-button").click()
        })

        gcy("simple-hateoas-list").within(() => {
            cy.get("li").should("have.length", 1)
        })

        gcy("simple-hateoas-list").xpath("." + getAnyContainingText("OWNER")).closest("li").within(() => {
            gcy("organization-invitation-cancel-button").click()
        })

        gcy("simple-hateoas-list").should("not.exist")
    })

    it("owner invitation can be accepted", () => {
        testAcceptInvitation("OWNER")
    })

    it("member invitation can be accepted", () => {
        testAcceptInvitation("MEMBER")
    })

    after(() => {
        cleanOrganizationData()
    })

    const visit = async () => {
        await cy.visit(`${HOST}/organizations/tolgee/invitations`).promisify()
    }

    const generateInvitation = (roleType: "MEMBER" | "OWNER") => {
        gcy("organization-invitation-role-select").click()
        gcy("organization-role-select-item").filter(":visible").within(() => {
            cy.contains(roleType).click()
        })
        gcy("organization-invitation-generate-button").click()
    }

    const testAcceptInvitation = (roleType: "MEMBER" | "OWNER") => {
        generateInvitation(roleType)

        gcy("organization-invitations-generated-field").find("textarea").invoke("val").then((val) => {
            login("owner@zzzcool12.com", "admin")
            cy.visit(val as string)
        })

        assertMessage("Invitation successfully accepted")
        cy.visit(`${HOST}/organizations`)
        cy.gcy("global-paginated-list")
            .contains("Tolgee")
            .should("be.visible").closest("li")
            .within(() => {
                cy.gcy("organization-settings-button").should(roleType === "MEMBER" ? "not.exist" : "be.visible")
            })
    }

})


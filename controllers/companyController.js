const Company = require("../models/Company");

async function getCompanyById(companyId) {
    return Company.findById(companyId).select("-password");
}

exports.getCompanyProfile = async (req, res) => {
    try {
        const company = await getCompanyById(req.user.id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company profile not found" });
        }

        return res.status(200).json({
            success: true,
            profile: {
                companyName: company.companyName,
                email: company.email,
                industry: company.industry,
                foundedYear: company.foundedYear,
                fundingNeeded: company.fundingNeeded,
                equityOffered: company.equityOffered,
            },
        });
    } catch (error) {
        console.error("getCompanyProfile error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch company profile" });
    }
};

exports.updateCompanyProfile = async (req, res) => {
    console.log("updateCompanyProfile payload keys:", Object.keys(req.body || {}));
    try {
        const payload = req.body || {};
        const updates = {};

        if (payload.companyName !== undefined) {
            const companyName = String(payload.companyName || "").trim();
            if (!companyName) {
                return res.status(400).json({ success: false, message: "Company name is required" });
            }
            updates.companyName = companyName;
        }

        if (payload.industry !== undefined) {
            const industry = String(payload.industry || "").trim();
            if (!industry) {
                return res.status(400).json({ success: false, message: "Industry is required" });
            }
            updates.industry = industry;
        }

        if (payload.foundedYear !== undefined) {
            const foundedYear = Number(payload.foundedYear);
            if (!Number.isInteger(foundedYear) || foundedYear < 1800 || foundedYear > new Date().getFullYear()) {
                return res.status(400).json({ success: false, message: "Invalid founded year" });
            }
            updates.foundedYear = foundedYear;
        }

        if (payload.fundingNeeded !== undefined) {
            const fundingNeeded = String(payload.fundingNeeded || "").trim();
            if (!fundingNeeded) {
                return res.status(400).json({ success: false, message: "Funding needed is required" });
            }
            updates.fundingNeeded = fundingNeeded;
        }

        if (payload.equityOffered !== undefined) {
            const equityOffered = Number(payload.equityOffered);
            if (Number.isNaN(equityOffered) || equityOffered < 0 || equityOffered > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Equity offered must be between 0 and 100",
                });
            }
            updates.equityOffered = equityOffered;
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ success: false, message: "No valid profile fields provided" });
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedCompany) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile: {
                companyName: updatedCompany.companyName,
                email: updatedCompany.email,
                industry: updatedCompany.industry,
                foundedYear: updatedCompany.foundedYear,
                fundingNeeded: updatedCompany.fundingNeeded,
                equityOffered: updatedCompany.equityOffered,
            },
        });
    } catch (error) {
        console.error("updateCompanyProfile error:", error);
        return res.status(500).json({ success: false, message: "Failed to update company profile" });
    }
};

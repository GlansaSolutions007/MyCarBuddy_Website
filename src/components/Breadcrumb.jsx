import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FaHome, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import "./Breadcrumb.css";

const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;

const Breadcrumb = ({ title }) => {
  const location = useLocation();
  const params = useParams();
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);

  // const formatTitle = (text) => {
  //   if (!text) return "";
  //   return text
  //     .replace(/-/g, " ")
  //     .replace(/\b\w/g, (char) => char.toUpperCase());
  // };
  const formatTitle = (text) => {
    if (!text) return "";

    return text
      .replace(/-/g, " ")
      .split(" ")
      .map((word) =>
        word.toLowerCase() === "ac"
          ? "AC"
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };


  useEffect(() => {
    const pathname = location.pathname;

    // Check if we're on servicedetails route
    if (pathname.startsWith("/servicedetails/")) {
      // For servicedetails, we need to fetch the parent category
      const fetchParentCategory = async () => {
        try {
          const { id } = params;
          if (!id) {
            // Fallback if no id
            const items = [
              { label: "Home", path: "/", isLink: true },
              {
                label: title || formatTitle(params.packagename) || "Service Details",
                path: pathname,
                isLink: false,
              },
            ];
            setBreadcrumbItems(items);
            return;
          }

          // Fetch package to get categoryId
          const packageResponse = await axios.get(
            `${BaseURL}PlanPackage/GetPlanPackagesByCategoryAndSubCategory`
          );

          const packageData = packageResponse.data.find(
            (pkg) => pkg.PackageID === parseInt(id)
          );

          if (packageData && packageData.CategoryID) {
            // Fetch category name
            const categoryResponse = await axios.get(`${BaseURL}Category`);
            const category = categoryResponse.data.find(
              (cat) => cat.CategoryID === packageData.CategoryID
            );

            if (category) {
              // Update breadcrumb items
              const items = [
                { label: "Home", path: "/", isLink: true },
                {
                  label: formatTitle(category.CategoryName),
                  path: `/service/${category.CategorySlug || category.CategoryName.toLowerCase().replace(/\s+/g, "-")}/${category.CategoryID}`,
                  isLink: true,
                },
                {
                  label: title || formatTitle(params.packagename),
                  path: pathname,
                  isLink: false,
                },
              ];
              setBreadcrumbItems(items);
            } else {
              // Fallback if category not found
              const items = [
                { label: "Home", path: "/", isLink: true },
                {
                  label: title || formatTitle(params.packagename) || "Service Details",
                  path: pathname,
                  isLink: false,
                },
              ];
              setBreadcrumbItems(items);
            }
          } else {
            // Fallback if package not found
            const items = [
              { label: "Home", path: "/", isLink: true },
              {
                label: title || formatTitle(params.packagename) || "Service Details",
                path: pathname,
                isLink: false,
              },
            ];
            setBreadcrumbItems(items);
          }
        } catch (error) {
          console.error("Error fetching parent category:", error);
          // Fallback: just show Home > Service Details
          const items = [
            { label: "Home", path: "/", isLink: true },
            {
              label: title || formatTitle(params.packagename) || "Service Details",
              path: pathname,
              isLink: false,
            },
          ];
          setBreadcrumbItems(items);
        }
      };

      fetchParentCategory();
    } else {
      // For other routes, build breadcrumb directly
      const items = [];
      items.push({ label: "Home", path: "/", isLink: true });

      if (pathname.startsWith("/service/") && params.categoryname) {
        // For service route, show the category name
        items.push({
          label: formatTitle(params.categoryname),
          path: pathname,
          isLink: false,
        });
      } else if (title) {
        // For other routes, just show the title
        items.push({
          label: title,
          path: pathname,
          isLink: false,
        });
      }

      setBreadcrumbItems(items);
    }
  }, [location.pathname, params, title]);

  return (
    <div className="bc-wrapper">
      <div className="bc-bg-overlay"></div>
      <div className="container">
        <div className="bc-content">
          {/* <h1 className="bc-title">{title}</h1> */}
          <h1 className="bc-title">{formatTitle(title)}</h1>
          <nav className="bc-nav">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <FaChevronRight className="bc-separator" />}
                {item.isLink ? (
                  <Link to={item.path} className="bc-link">
                    {index === 0 && <FaHome className="bc-home-icon" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span className="bc-current">{item.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;

///////////////////////////////////////////////////////////////////////

// import React from "react";
// import { Link } from "react-router-dom";

// const Breadcrumb = ({ title }) => {
//   return (
//     <div className="breadcumb-wrapper">
//       <div className="container">
//         <div className="row">
//           <div className="col-lg-6">
//             <div className="breadcumb-content d-flex justify-content-between">
//               <h1 className="breadcumb-title">{title}</h1>
//               <ul className="breadcumb-menu mt-0">
//                 <li>
//                   <Link to="/">Home</Link>
//                 </li>
//                 <li className="active">{title}</li>
//               </ul>
//             </div>
//           </div>
//           {/* <div className="col-lg-6 d-lg-block d-none">
//             <div className="breadcumb-thumb">
//               <img src="/assets/img/normal/breadcrumb-thumb.png" alt="Fixturbo" />
//             </div>
//           </div> */}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Breadcrumb;


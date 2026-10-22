import React, { useEffect, useState } from "react";
import { API_ADMIN } from "../../../config/api";
import { getAdminToken, clearAdminSession } from "../../../utils/adminAuth";
import { useNavigate } from "react-router-dom";

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
const [currentPage, setCurrentPage] = useState(1);

const itemsPerPage = 10;

const filteredGroups = groups.filter((g) =>
  g.name?.toLowerCase().includes(search.toLowerCase())
);

const indexOfLastGroup = currentPage * itemsPerPage;
const indexOfFirstGroup = indexOfLastGroup - itemsPerPage;

const currentGroups = filteredGroups.slice(
  indexOfFirstGroup,
  indexOfLastGroup
);

const totalPages = Math.ceil(
  filteredGroups.length / itemsPerPage
);

const getPageNumbers = () => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  return pages;
};



  useEffect(() => {
    const load = async () => {
      const token = getAdminToken();
      if (!token) {
        navigate("/admin/login");
        return;
      }

      const res = await fetch(`${API_ADMIN}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const data = await res.json();
      setGroups(data.groups || []);
      setLoading(false);
    };

    load();
  }, []);

  return (
<div className="admin-users-page">

  {/* Header */}
  <div className="users-header-card">

    <div className="header-left">

      <div className="header-icon">
        <i className="bi bi-collection-fill"></i>
      </div>

      <div>
        <h2>Groups Management</h2>
        <p>Manage all created groups</p>
      </div>

    </div>

    <button
      className="dashboard-btn"      
    >
      <i className="bi bi-arrow-repeat me-2"></i>
      Refresh
    </button>

  </div>

  {/* Search */}

  <div className="table-top-bar">

    <div className="search-wrapper">

      <i className="bi bi-search"></i>

      <input
        type="text"
        className="search-input"
        placeholder="Search group..."
        value={search}
        onChange={(e)=>{
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
      />

    </div>

  </div>

  {/* Table */}

  <div className="users-table-card">

    {loading ? (

      <div className="empty-state">
        Loading Groups...
      </div>

    ) : (

      <div className="table-responsive">

        <table className="premium-table">

          <thead>

            <tr>

              <th>#</th>

              <th>Group</th>

              <th>Members</th>

              <th>Created</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {currentGroups.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  className="empty-state"
                >
                  No Groups Found
                </td>

              </tr>

            ) : (

              currentGroups.map((g,index)=>(

                <tr key={g._id}>

                  <td>
                    {indexOfFirstGroup + index + 1}
                  </td>

                  <td>

                    <div className="user-cell">

                      <div>

                        <div className="user-name">

                          {g.name}

                        </div>

                        <div className="user-email">

                          {g._id}

                        </div>

                      </div>

                    </div>

                  </td>

                  <td>

                    <span className="coin-badge">

                      {g.members?.length || 0} Members

                    </span>

                  </td>

                  <td>

                    {g.createdAt
                      ? new Date(g.createdAt).toLocaleDateString()
                      : "-"}

                  </td>

                  <td>

                    <span className="status-badge completed">

                      Active

                    </span>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    )}

  </div>

  {/* Pagination */}

  {totalPages > 1 && (

    <div className="custom-pagination">

      <button
        disabled={currentPage===1}
        onClick={()=>setCurrentPage(prev=>prev-1)}
      >
        <i className="bi bi-chevron-left"></i>
      </button>

      {getPageNumbers().map((page)=>(

        <button
          key={page}
          className={
            currentPage===page
              ?"active-page"
              :""
          }
          onClick={()=>setCurrentPage(page)}
        >
          {page}
        </button>

      ))}

      <button
        disabled={currentPage===totalPages}
        onClick={()=>setCurrentPage(prev=>prev+1)}
      >
        <i className="bi bi-chevron-right"></i>
      </button>

    </div>

  )}

</div>
  );}

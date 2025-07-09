"use client";

import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css"; // Importing CSS Module for styles
import React from "react";
import { Plus } from "lucide-react"; // Import an icon


type Bill = {
  id: number; // The auto-generated primary key
  date: string;
  cardType: string;
  company: string;
  amount: number;
  type: "Debit" | "Credit";
};


const companyCardTypes: { [key: string]: string[] } = {
  "Bank Of America": ["Alaska Airlines", "Premium Rewards", "Checking", "Credit", "Target Debit", "Salary", "Investments"],
  "American Express": [
    "Business Platinum", "Personal Gold", "Personal Green", "Macys", "Personal Blue Cash", "Delta Gold", "Personal Platinum"
  ],
  "Chase": ["Southwest", "Aeroplan", "Amazon", "Freedom", "Freedom Unlimited"],
  "Barclays": ["Emirates"],
  "Discover": ["Miles"],
  "Citi": ["Rewards", "American Airlines", "Best Buy"],
  "Gold Man Sachs": ["Apple Card"],
  "Capital One": ["Venture X", "Venture", "BJs"],
  "Utilities": ["Gas", "Electricity", "Internet", "Mobile"]
};

export default function Home() {
  const [checkingBalance, setCheckingBalance] = useState(0);
  const [bills, setBills] = useState<Bill[]>([]); // Bills now include 'id'
  const [newBill, setNewBill] = useState<Bill>({
    id: 0,
    date: "",
    cardType: "",
    company: "",
    amount: 0,
    type: "Debit", // Default is Debit
  });

  const [isModalOpen, setIsModalOpen] = useState(false); // For modal visibility

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setNewBill({ ...newBill, [e.target.name]: e.target.value });
  };

  const addBill = async () => {
    if (
      !newBill.date ||
      !newBill.cardType ||
      !newBill.company ||
      !newBill.amount
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("/api/groceries_tracker", {
        method: "POST",
        body: JSON.stringify({
          date: newBill.date,
          cardType: newBill.cardType,
          company: newBill.company,
          amount: Number(newBill.amount), // Ensure amount is a number
          type: newBill.type,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const addedBill = await response.json();
      //console.log(addedBill); // Log the response to see what is returned

      // Directly update the bills state with the newly added bill
      setBills((prevBills) => [...prevBills, addedBill]);

      // After adding the bill, re-fetch the list of bills
      const fetchBills = async () => {
        try {
          const billsResponse = await fetch("/api/groceries_tracker");
          const fetchedBills = await billsResponse.json();
          setBills(fetchedBills); // Update bills state with fetched data
        } catch (error) {
          console.error("Error fetching bills:", error);
        }
      };

      fetchBills(); // Re-fetch bills from the API

      // Reset the form and close modal
      setNewBill({
        id: 0,
        date: "",
        cardType: "",
        company: "",
        amount: 0,
        type: "Debit",
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding bill:", error);
    }
  };

  // Dynamically calculate the checking balance (based on Credits) and Total Bills (based on Debits)
  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch("/api/groceries_tracker");
        const fetchedBills = await response.json();
        if (!Array.isArray(fetchedBills)) {
          console.error("Fetched bills is not an array:", fetchedBills);
          return;
        }

        const validatedBills = fetchedBills.filter((bill) => bill.date);
        setBills(validatedBills);

        // Calculate checking balance based on 'Credit' bills
        const totalCredits = fetchedBills.reduce((sum: number, bill: Bill) => {
          if (bill.type === "Credit") {
            return sum + bill.amount;
          }
          return sum;
        }, 0);

        setCheckingBalance(totalCredits); // Set checking balance to the sum of all Credit bills
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };

    fetchBills();
  }, []); // Empty dependency array to run only on mount

  // Total Bills: Sum of all 'Debit' bill amounts
  const totalBills = bills.reduce(
    (sum, bill) => (bill.type === "Debit" ? sum + bill.amount : sum),
    0
  );

  // Remaining Balance: Checking Balance - Total Bills
  const remainingBalance = checkingBalance - totalBills;

  return (
    <div className={styles.container}>
      <button
        onClick={() => setIsModalOpen(true)}
        className={styles.addBillButtonFixed}>
        <Plus size={20} />
      </button>
      {/* Balance Overview */}
      <div className={styles.balanceOverview}>
        <div className={styles.header}>
          <h1>💳 Credit Tracker</h1>
          <div className={styles.balanceDetails}>
            <p>
              <strong>Checking Balance:</strong> ${checkingBalance.toFixed(2)}
            </p>
            <p>
              <strong>Total Bills:</strong> ${totalBills.toFixed(2)}
            </p>
            <p
              className={
                remainingBalance >= 0
                  ? styles.positiveBalance
                  : styles.negativeBalance
              }
            >
              <strong>
                Remaining Balance: <span className={remainingBalance < 0 ? styles.negativeAmount : ''}>
                  ${remainingBalance.toFixed(2)}
                </span>
              </strong>            </p>
          </div>
        </div>
      </div>



      {/* Bills Table */}
      <div className={styles.billsTable}>
        <h2>Upcoming Bills</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th>Date</th>
                <th>Company</th>
                <th>Card Type</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {bills.length > 0 ? (
                [...bills]
                  .sort((a, b) => {
                    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
                    if (dateDiff !== 0) return dateDiff; // Sort by date first

                    const companyDiff = a.company.localeCompare(b.company);
                    if (companyDiff !== 0) return companyDiff; // Then sort by company

                    return a.cardType.localeCompare(b.cardType); // Finally, sort by card type
                  }).reduce(
                    (acc: { bill: Bill; balance: number; monthYear: string; billDate: Date }[], bill, index) => {
                      let newBalance;
                      if (index === 0) {
                        newBalance = bill.amount;
                      } else {
                        const prevBalance = acc[index - 1].balance;
                        newBalance = bill.type === "Credit" ? prevBalance + bill.amount : prevBalance - bill.amount;
                      }

                      const [year, month, day] = bill.date ? bill.date.split("-").map(Number) : [0, 0, 0];
                      const billDate = new Date(year, month - 1, day);
                      const monthYear = `${billDate.getFullYear()}-${billDate.getMonth()}`;

                      return [...acc, { bill, balance: newBalance, monthYear, billDate }];
                    },
                    []
                  )
                  .map(({ bill, balance, monthYear, billDate }, index, array) => {
                    const prevMonthYear = array[index - 1]?.monthYear;
                    const isNewMonth = index === 0 || monthYear !== prevMonthYear;
                    const displayMonthYear = billDate.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    });

                    // **Calculate total credits and debits for this month**
                    const monthlyBills = array.filter((item) => item.monthYear === monthYear);

                    const totalCredits = monthlyBills.reduce(
                      (sum, item) => (item.bill.type === "Credit" ? sum + item.bill.amount : sum),
                      0
                    );
                    const totalDebits = monthlyBills.reduce(
                      (sum, item) => (item.bill.type === "Debit" ? sum + item.bill.amount : sum),
                      0
                    );

                    return (
                      <React.Fragment key={bill.id}>
                        {isNewMonth && (
                          <tr className={styles.monthHeaderRow}>
                            <td colSpan={6} className={styles.monthHeader}>
                              {displayMonthYear}&ensp;-&ensp;
                              <span style={{ color: "green" }}>Credits: ${totalCredits.toFixed(2)}</span>&emsp;
                              <span style={{ color: "red" }}>Debits: ${totalDebits.toFixed(2)}</span>
                            </td>
                          </tr>
                        )}
                        <tr style={isNewMonth ? { borderTop: "2px solid black" } : {}}>
                          <td className={styles.tableCell}>{bill.date}</td>
                          <td className={styles.tableCell}>{bill.company}</td>
                          <td className={`${styles.tableCell} ${styles.hideOnMobile}`}>{bill.cardType}</td>
                          <td className={`${styles.tableCell} ${bill.type === "Credit" ? styles.positiveAmount : styles.negativeAmount}`}>
                            ${bill.type === "Credit" ? bill.amount : -bill.amount}
                          </td>
                          <td className={styles.tableCell}>{bill.type}</td>
                          {/*                           <td className={styles.tableCell}>${balance.toFixed(2)}</td> */}
                          <td className={`${styles.tableCell} ${balance < 0 ? styles.negativeAmount : ''}`}>
                            ${balance.toFixed(2)}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.tableCell}>No bills found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Bill Button */}
      {/* <div className={styles.addBillButtonContainer}>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.addBillButton}
        >
          + Add New Bill
        </button>
      </div> */}

      {/* Modal for Adding Bill */}
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Add a New Bill</h2>
            <div className={styles.formGroup}>
              <input
                type="date"
                name="date"
                value={newBill.date}
                onChange={handleChange}
              />
              <select
                name="company"
                value={newBill.company}
                onChange={handleChange}
              >
                <option value="">Select Company</option>
                {Object.keys(companyCardTypes).map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
              <select
                name="cardType"
                value={newBill.cardType}
                onChange={handleChange}
              >
                <option value="">Select Card Type</option>
                {newBill.company &&
                  companyCardTypes[newBill.company]?.map((cardType) => (
                    <option key={cardType} value={cardType}>
                      {cardType}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={newBill.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
              <select
                name="type"
                value={newBill.type}
                onChange={handleChange}
                required
              >
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeModalButton}
              >
                Close
              </button>
              <button
                onClick={addBill}
                className={styles.addButton}
              >
                Add Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

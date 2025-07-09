"use client";

import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css"; // Importing CSS Module for styles
import React from "react";
import { Plus } from "lucide-react"; // Import an icon


type Bill = {
  id: number; // The auto-generated primary key
  date: string;
  product: string;
  productType: string;
  apna_amount: number;
  ism_amount: number;
  per_lb_pc: string;
};


const productList: { [key: string]: string[] } = {
  "Vegetables": ["Cilantro", "Coriander","Spinach","Okra","Green Beans","Green Chillies","Egg Plant"]
};

export default function Home() {
  // const [checkingBalance, setCheckingBalance] = useState(0);
  const [bills, setBills] = useState<Bill[]>([]); // Bills now include 'id'
  const [newBill, setNewBill] = useState<Bill>({
    id: 0,
    date: "",
    product: "",
    productType: "",
    apna_amount: 0,
    ism_amount: 0,
    per_lb_pc: "", // Default is Debit
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
      !newBill.product ||
      !newBill.productType ||
      !newBill.apna_amount ||
      !newBill.ism_amount ||
      !newBill.per_lb_pc
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("/api/groceries", {
        method: "POST",
        body: JSON.stringify({
          date: newBill.date,
          product: newBill.product,
          productType: newBill.productType,
          apna_amount: Number(newBill.apna_amount), // Ensure amount is a number
          ism_amount: Number(newBill.ism_amount), // Ensure amount is a number
          per_lb_pc: newBill.per_lb_pc,
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
          const billsResponse = await fetch("/api/groceries");
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
        product: "",
        productType: "",
        apna_amount: 0,
        ism_amount: 0,
        per_lb_pc: "",
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
        const response = await fetch("/api/groceries");
        const fetchedBills = await response.json();
        if (!Array.isArray(fetchedBills)) {
          console.error("Fetched bills is not an array:", fetchedBills);
          return;
        }

        const validatedBills = fetchedBills.filter((bill) => bill.date);
        setBills(validatedBills);

        // Calculate checking balance based on 'Credit' bills
        // const totalCredits = fetchedBills.reduce((sum: number, bill: Bill) => {
        //   if (bill.per_lb_pc === "Credit") {
        //     return sum + bill.apna_amount;
        //   }
        //   return sum;
        // }, 0);

        // setCheckingBalance(totalCredits); // Set checking balance to the sum of all Credit bills
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };

    fetchBills();
  }, []); // Empty dependency array to run only on mount

  // Total Bills: Sum of all 'Debit' bill amounts
  // const totalBills = bills.reduce(
  //   (sum, bill) => (bill.per_lb_pc === "Debit" ? sum + bill.apna_amount : sum),
  //   0
  // );

  // Remaining Balance: Checking Balance - Total Bills
  // const remainingBalance = checkingBalance - totalBills;

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
              {/* <strong>Checking Balance:</strong> ${checkingBalance.toFixed(2)} */}
            </p>
            <p>
              {/* <strong>Total Bills:</strong> ${totalBills.toFixed(2)} */}
            </p>
            <p
              // className={
              //   remainingBalance >= 0
              //     ? styles.positiveBalance
              //     : styles.negativeBalance
              // }
            >
              <strong>
                {/* Remaining Balance: <span className={remainingBalance < 0 ? styles.negativeAmount : ''}> */}
                  {/* ${remainingBalance.toFixed(2)} */}
                {/* </span> */}
              </strong>            </p>
          </div>
        </div>
      </div>



      {/* Bills Table */}
      <div className={styles.billsTable}>
        {/* <h2>Upcoming Bills</h2> */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th>Date</th>
                <th>Product</th>
                {/* <th>Card Type</th> */}
                <th>Apna Bazaar Price</th>
                <th>India Supermarket Price</th>
                <th>Per lbs/pc</th>
                {/* <th>Balance</th> */}
              </tr>
            </thead>
            <tbody>
              {bills.length > 0 ? (
                [...bills]
                  .sort((a, b) => {
                    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
                    if (dateDiff !== 0) return dateDiff; // Sort by date first

                    const companyDiff = a.product.localeCompare(b.product);
                    if (companyDiff !== 0) return companyDiff; // Then sort by company

                    return a.product.localeCompare(b.product); // Finally, sort by card type
                  }).reduce(
                    (acc: { bill: Bill; monthYear: string; billDate: Date }[], bill) => {
                      let newBalance;

                      const [year, month, day] = bill.date ? bill.date.split("-").map(Number) : [0, 0, 0];
                      const billDate = new Date(year, month - 1, day);
                      const monthYear = `${billDate.getFullYear()}-${billDate.getMonth()}`;

                      return [...acc, { bill, balance: newBalance, monthYear, billDate }];
                    },
                    []
                  )
                  .map(({ bill, monthYear, billDate }, index, array) => {
                    const prevMonthYear = array[index - 1]?.monthYear;
                    const isNewMonth = index === 0 || monthYear !== prevMonthYear;
                    const displayMonthYear = billDate.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <React.Fragment key={bill.id}>
                        {isNewMonth && (
                          <tr className={styles.monthHeaderRow}>
                            <td colSpan={6} className={styles.monthHeader}>
                              {displayMonthYear}&ensp;-&ensp;
                            </td>
                          </tr>
                        )}
                        <tr style={isNewMonth ? { borderTop: "2px solid black" } : {}}>
                          <td className={styles.tableCell}>{bill.date}</td>
                          <td className={styles.tableCell}>{bill.productType}</td>
                          <td className={styles.tableCell}>${bill.apna_amount}</td>
                          <td className={styles.tableCell}>${bill.ism_amount}</td>
                          <td className={styles.tableCell}>{bill.per_lb_pc}</td>
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
                name="product"
                value={newBill.product}
                onChange={handleChange}
              >
                <option value="">Select Company</option>
                {Object.keys(productList).map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
              <select
                name="productType"
                value={newBill.productType}
                onChange={handleChange}
              >
                <option value="">Select Card Type</option>
                {newBill.product &&
                  productList[newBill.product]?.map((productType) => (
                    <option key={productType} value={productType}>
                      {productType}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                name="apna_amount"
                placeholder="Apna Bazaar"
                value={newBill.apna_amount}
                onChange={handleChange}
                required
                // min="0"
                step="0.01"
              />
                  <input
                type="number"
                name="ism_amount"
                placeholder="India Supermarket"
                value={newBill.ism_amount}
                onChange={handleChange}
                required
                // min="0"
                step="0.01"
              />
              <select
                name="type"
                value={newBill.per_lb_pc}
                onChange={handleChange}
                required
              >
                <option value="LBS">lbs</option>
                <option value="EACH">ea</option>
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

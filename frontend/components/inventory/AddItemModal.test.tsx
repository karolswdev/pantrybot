import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddEditItemModal } from './AddEditItemModal';

describe('AddItemModal', () => {
  const mockOnSubmit = jest.fn();
  const mockOnOpenChange = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
    location: "fridge" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup();
    
    render(<AddEditItemModal {...defaultProps} />);

    // Wait for modal to be visible
    expect(screen.getByText('Add Item to Fridge')).toBeInTheDocument();

    // Find and click the save button without filling any fields
    const saveButton = screen.getByRole('button', { name: /save item/i });
    await user.click(saveButton);

    // Wait for validation errors to appear
    await waitFor(() => {
      // Check for required field validation errors
      expect(screen.getByText('Item name is required')).toBeInTheDocument();
    });

    // Clear the quantity field to trigger its validation
    const quantityInput = screen.getByLabelText(/quantity \*/i);
    await user.clear(quantityInput);
    await user.click(saveButton);

    await waitFor(() => {
      // Check for quantity validation error
      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument();
    });

    // Check that the form was not submitted
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate field constraints', async () => {
    const user = userEvent.setup();
    
    render(<AddEditItemModal {...defaultProps} />);

    // Test name field max length
    const nameInput = screen.getByLabelText(/item name \*/i);
    const longName = 'a'.repeat(101);
    await user.type(nameInput, longName);
    
    const saveButton = screen.getByRole('button', { name: /save item/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be less than 100 characters')).toBeInTheDocument();
    });

    // Test negative quantity
    const quantityInput = screen.getByLabelText(/quantity \*/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '-5');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument();
    });

    // Test notes field max length
    const notesInput = screen.getByLabelText(/notes/i);
    const longNotes = 'a'.repeat(501);
    await user.type(notesInput, longNotes);
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Notes must be less than 500 characters')).toBeInTheDocument();
    });

    // Verify form was not submitted with invalid data
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    
    render(<AddEditItemModal {...defaultProps} />);

    // Fill in required fields with valid data
    const nameInput = screen.getByLabelText(/item name \*/i);
    await user.type(nameInput, 'Organic Milk');

    const quantityInput = screen.getByLabelText(/quantity \*/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    // Unit and location should have default values already

    // Submit the form
    const saveButton = screen.getByRole('button', { name: /save item/i });
    await user.click(saveButton);

    // Verify the form was submitted with valid data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Organic Milk',
          quantity: 2,
          unit: 'item',
          location: 'fridge',
        })
      );
    });
  });

  it('should show different title for edit mode', () => {
    const editItem = {
      id: '1',
      name: 'Test Item',
      quantity: 1,
      unit: 'item',
      location: 'fridge' as const,
      category: 'Dairy',
    };

    render(<AddEditItemModal {...defaultProps} item={editItem} />);

    expect(screen.getByText('Edit Item')).toBeInTheDocument();
    expect(screen.queryByText('Add Item to Fridge')).not.toBeInTheDocument();
  });

  it('should populate form with item data in edit mode', () => {
    const editItem = {
      id: '1',
      name: 'Test Item',
      quantity: 3,
      unit: 'kg',
      location: 'freezer' as const,
      category: 'Meat',
      notes: 'Test notes',
    };

    render(<AddEditItemModal {...defaultProps} item={editItem} />);

    // Verify form is populated with item data
    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });
});
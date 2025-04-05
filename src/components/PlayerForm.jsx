import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

const PlayerSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  role: Yup.string().required('Required'),
});

const PlayerForm = ({ initialValues, onSubmit }) => {
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={PlayerSchema}
      onSubmit={(values) => {
        onSubmit(values);
        navigate('/');
      }}
    >
      {({ errors, touched }) => (
        <Form className="space-y-4 px-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Field name="name" className="w-full border p-2 rounded-md" />
            {errors.name && touched.name && (
              <div className="text-red-500 text-xs">{errors.name}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            <Field as="select" name="role" className="w-full border p-2 rounded-md">
              <option value="">Select Role</option>
              <option value="batsman">Batsman</option>
              <option value="bowler">Bowler</option>
              <option value="all rounder">All Rounder</option>
              <option value="wicket keeper">Wicket Keeper</option>
            </Field>
            {errors.role && touched.role && (
              <div className="text-red-500 text-xs">{errors.role}</div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 rounded-lg shadow"
            >
              Save Player
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1 flex-1 bg-red-100 text-red-600 py-2 rounded-lg shadow hover:bg-red-200"
              onClick={() => navigate('/')}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default PlayerForm;
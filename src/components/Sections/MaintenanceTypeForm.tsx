@@ .. @@
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Intervalle en heures</label>
             <input
-              name="intervalleHeures"
+              name="intervalleHeures" 
               type="number"
               step="0.1"
               min="0"
               defaultValue={editingType?.intervalleHeures || ''}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
-            <p className="text-xs text-gray-500 mt-1">
-              Heures machine entre chaque maintenance
+            <p className="text-xs text-blue-600 font-medium mt-1">
+              Heures machine entre chaque maintenance (prioritaire)
             </p>
           </div>
           
@@ .. @@
               defaultValue={editingType?.intervalleJours || ''}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
-            <p className="text-xs text-gray-500 mt-1">
-              Jours calendaires entre chaque maintenance
+            <p className="text-xs text-gray-500 mt-1">
+              Jours calendaires (utilisé si heures non disponibles)
             </p>
           </div>
         </div>
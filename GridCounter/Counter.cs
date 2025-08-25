using System.Diagnostics;

namespace GridCounter
{
    public class Counter
    {
        public int Count(int gridSize)
        {
            Debug.Assert(gridSize > 0);
            int count = 0;
            for (int countSize = 1; countSize <= gridSize; countSize++)
            {
                for (int vertical = 0; vertical <= gridSize - countSize; vertical++)
                {
                    for (int horizontal = 0; horizontal <= gridSize - countSize; horizontal++)
                    {
                        count++;
                    }
                }
            }
            return count;
        }
    }
}

